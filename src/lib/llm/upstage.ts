import type { LlmProvider, StreamEvent, StreamRequest } from "./provider";
import {
  externalSearch,
  formatSearchResultForLlm,
} from "@/lib/tools/externalSearch";

const DEFAULT_MODEL = "solar-pro2";
const ENDPOINT = "https://api.upstage.ai/v1/chat/completions";

type ChatMessageParam =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCallPayload[] }
  | { role: "tool"; tool_call_id: string; content: string };

type ToolCallPayload = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type StreamChoiceDelta = {
  content?: string;
  tool_calls?: Array<{
    index?: number;
    id?: string;
    type?: "function";
    function?: { name?: string; arguments?: string };
  }>;
};

type StreamChunk = {
  choices?: Array<{
    delta?: StreamChoiceDelta;
    finish_reason?: string | null;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

const WEB_SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "대한민국 공공 복지 관련 최신 정책·금액·공고를 공식 출처(.go.kr/.or.kr 등)에서 검색합니다. 사업명·지자체명·연도를 포함한 한국어 쿼리를 사용하세요.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "검색 쿼리(한국어)" },
      },
      required: ["query"],
    },
  },
};

/**
 * Upstage Solar 공급자 — OpenAI 호환 API 사용.
 * 네이티브 웹검색이 없으므로 function tool + 외부 검색(Tavily)으로 에이전트 루프 구현.
 */
export class UpstageProvider implements LlmProvider {
  readonly name = "upstage" as const;
  private readonly defaultKey: string | undefined;
  private readonly model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    this.defaultKey = opts?.apiKey ?? process.env.UPSTAGE_API_KEY;
    this.model = opts?.model ?? process.env.UPSTAGE_MODEL ?? DEFAULT_MODEL;
  }

  async *streamChat(req: StreamRequest): AsyncIterable<StreamEvent> {
    const apiKey = req.apiKey ?? this.defaultKey;
    if (!apiKey) {
      yield { type: "error", message: "UPSTAGE_API_KEY가 설정되지 않았습니다." };
      return;
    }

    const systemContent = req.system.map((b) => b.text).join("\n\n");
    const messages: ChatMessageParam[] = [
      { role: "system", content: systemContent },
      ...req.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const webSearchTool = req.tools?.find((t) => t.type === "web_search");
    const tools = webSearchTool ? [WEB_SEARCH_TOOL] : undefined;
    const maxSearches = webSearchTool?.maxUses ?? 5;
    const allowedDomains = webSearchTool?.allowedDomains ?? [];

    let searchCount = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let turn = 0; turn < maxSearches + 1; turn++) {
      const isLastTurn = searchCount >= maxSearches;
      console.info(
        "[upstage] turn",
        turn,
        "model",
        this.model,
        "searchCount",
        searchCount,
        "messages",
        messages.length,
        isLastTurn ? "(forced no-tool)" : "",
      );
      const body = {
        model: this.model,
        messages,
        ...(tools && !isLastTurn ? { tools, tool_choice: "auto" as const } : {}),
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        stream: true,
        stream_options: { include_usage: true },
      };

      let res: Response;
      try {
        res = await fetch(ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: req.signal,
        });
      } catch (err) {
        console.error("[upstage] fetch failed", err);
        yield {
          type: "error",
          message: err instanceof Error ? err.message : "Upstage 호출 실패",
        };
        return;
      }

      console.info("[upstage] http", res.status);

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        console.error("[upstage] api error", res.status, text.slice(0, 300));
        yield {
          type: "error",
          message: `Upstage API 오류 (HTTP ${res.status}): ${text.slice(0, 300)}`,
        };
        return;
      }

      const toolCalls: Map<number, { id: string; name: string; args: string }> = new Map();
      let finishReason: string | null = null;
      let turnContentChars = 0;

      try {
        for await (const chunk of parseSseStream(res.body)) {
          if (req.signal?.aborted) return;
          const choice = chunk.choices?.[0];
          const delta = choice?.delta;

          if (chunk.usage?.prompt_tokens) totalInputTokens = chunk.usage.prompt_tokens;
          if (chunk.usage?.completion_tokens) totalOutputTokens = chunk.usage.completion_tokens;

          if (delta?.content) {
            turnContentChars += delta.content.length;
            yield { type: "text_delta", text: delta.content };
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              const cur = toolCalls.get(idx) ?? { id: "", name: "", args: "" };
              if (tc.id) cur.id = tc.id;
              if (tc.function?.name) cur.name = tc.function.name;
              if (tc.function?.arguments) cur.args += tc.function.arguments;
              toolCalls.set(idx, cur);
            }
          }

          if (choice?.finish_reason) finishReason = choice.finish_reason;
        }
      } catch (err) {
        yield {
          type: "error",
          message: err instanceof Error ? err.message : "Upstage 스트리밍 오류",
        };
        return;
      }

      console.info(
        "[upstage] turn",
        turn,
        "end",
        "finishReason",
        finishReason,
        "contentChars",
        turnContentChars,
        "toolCallCount",
        toolCalls.size,
      );

      // 도구 호출 없이 종료 → 응답 완료
      if (finishReason !== "tool_calls" || toolCalls.size === 0) {
        yield {
          type: "done",
          usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        };
        return;
      }

      // forced no-tool turn 이었는데도 tool_calls 로 종료된 비정상 케이스 → 강제 종료.
      if (isLastTurn) {
        console.warn(
          "[upstage] forced no-tool turn returned tool_calls — terminating without further search",
        );
        yield {
          type: "done",
          usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        };
        return;
      }

      // assistant tool_calls 메시지 추가
      const toolCallPayloads: ToolCallPayload[] = Array.from(toolCalls.values()).map((c) => ({
        id: c.id || `call_${Math.random().toString(36).slice(2)}`,
        type: "function",
        function: { name: c.name, arguments: c.args || "{}" },
      }));
      messages.push({ role: "assistant", content: null, tool_calls: toolCallPayloads });

      // 각 도구 호출 실행
      for (const call of toolCallPayloads) {
        if (call.function.name !== "web_search") {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: `[지원하지 않는 도구: ${call.function.name}]`,
          });
          continue;
        }

        let query = "";
        try {
          const parsed = JSON.parse(call.function.arguments) as { query?: string };
          query = parsed.query ?? "";
        } catch {
          query = "";
        }

        if (!query) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: "[검색 실패: 쿼리가 비어 있습니다]",
          });
          continue;
        }

        // §31 Fix-1: maxSearches 도달 시 나머지 tool_calls 는 더미 응답으로 처리.
        // Solar Pro2 가 한 turn 에 여러 tool_calls 를 동시 emit 하는 경우 Tavily 비용
        // 폭증 방지. LLM 은 다음 turn 의 forced no-tool 분기로 진입.
        if (searchCount >= maxSearches) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content:
              "[검색 한도 초과: 이 요청은 실행되지 않았습니다. 다음 turn 에서 텍스트로 응답하세요]",
          });
          console.info(
            "[upstage] skip tool_call (over maxSearches)",
            JSON.stringify(query),
          );
          continue;
        }

        searchCount++;
        console.info("[upstage] tool_call web_search", JSON.stringify(query));
        yield { type: "tool_use", name: "web_search", input: { query } };

        const result = await externalSearch(query, allowedDomains, { signal: req.signal });
        console.info(
          "[upstage] search result hits",
          result.hits.length,
          result.notice ? `notice: ${result.notice.slice(0, 80)}` : "",
        );
        // 의도적으로 citation 자동 emit 안 함.
        // Tavily 가 반환한 모든 hit 을 citation 으로 노출하면 LLM 이 본문에서 사용 안 한
        // 무관 지역 URL 까지 표시되어 사용자가 신뢰할 수 없음. 최종 citation 목록은
        // route.ts 가 응답 본문(assembled) 에서 직접 인용된 URL 만 추출해 구성.

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: formatSearchResultForLlm(result),
        });
      }
    }

    // maxSearches+1 루프를 모두 소진한 경우(이론상 도달 안 함)
    yield {
      type: "done",
      usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
    };
  }
}

/** OpenAI 호환 SSE 스트림 파싱: `data: {...}\n\n` 청크를 JSON 객체로 yield. */
async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIdx: number;
      while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);

        for (const line of rawEvent.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            yield JSON.parse(payload) as StreamChunk;
          } catch {
            // 부분 파싱 실패는 무시
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
