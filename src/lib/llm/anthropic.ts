import Anthropic from "@anthropic-ai/sdk";
import type {
  LlmProvider,
  StreamEvent,
  StreamRequest,
} from "./provider";

const DEFAULT_MODEL = "claude-sonnet-4-5";

export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic" as const;
  private readonly defaultKey: string | undefined;
  private readonly model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    this.defaultKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY;
    this.model = opts?.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  }

  async *streamChat(req: StreamRequest): AsyncIterable<StreamEvent> {
    const apiKey = req.apiKey ?? this.defaultKey;
    if (!apiKey) {
      yield {
        type: "error",
        message: "ANTHROPIC_API_KEY가 설정되지 않았습니다.",
      };
      return;
    }
    const client = new Anthropic({ apiKey });

    const system = req.system.map((b) =>
      b.cache
        ? { type: "text" as const, text: b.text, cache_control: { type: "ephemeral" as const } }
        : { type: "text" as const, text: b.text },
    );

    const tools = (req.tools ?? []).map((t) => {
      if (t.type === "web_search") {
        return {
          type: "web_search_20250305" as const,
          name: "web_search",
          max_uses: t.maxUses ?? 5,
          ...(t.allowedDomains?.length
            ? { allowed_domains: t.allowedDomains }
            : {}),
        };
      }
      return null;
    }).filter(Boolean) as NonNullable<unknown>[];

    let stream: AsyncIterable<unknown>;
    try {
      stream = (await client.messages.stream({
        model: this.model,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        system,
        messages: req.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        ...(tools.length ? { tools: tools as never } : {}),
      })) as unknown as AsyncIterable<unknown>;
    } catch (err) {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : "Anthropic 호출 실패",
      };
      return;
    }

    let inputTokens = 0;
    let outputTokens = 0;

    try {
      for await (const eventRaw of stream as AsyncIterable<{
        type: string;
        delta?: { type?: string; text?: string };
        content_block?: { type?: string; url?: string; title?: string };
        message?: { usage?: { input_tokens?: number; output_tokens?: number } };
        usage?: { input_tokens?: number; output_tokens?: number };
      }>) {
        if (req.signal?.aborted) return;
        const event = eventRaw;
        switch (event.type) {
          case "content_block_delta":
            if (event.delta?.type === "text_delta" && event.delta.text) {
              yield { type: "text_delta", text: event.delta.text };
            } else if (event.delta?.type === "citations_delta") {
              const cite = (event.delta as unknown as { citation?: { url?: string; title?: string } }).citation;
              if (cite?.url) {
                yield {
                  type: "citation",
                  url: cite.url,
                  title: cite.title,
                };
              }
            }
            break;
          case "content_block_start":
            if (event.content_block?.type === "tool_use") {
              yield {
                type: "tool_use",
                name: "web_search",
                input: event.content_block,
              };
            }
            break;
          case "message_delta":
            if (event.usage?.output_tokens) {
              outputTokens = event.usage.output_tokens;
            }
            break;
          case "message_start":
            if (event.message?.usage?.input_tokens) {
              inputTokens = event.message.usage.input_tokens;
            }
            break;
          default:
            break;
        }
      }
      yield { type: "done", usage: { inputTokens, outputTokens } };
    } catch (err) {
      yield {
        type: "error",
        message: err instanceof Error ? err.message : "스트리밍 오류",
      };
    }
  }
}
