import type { LlmProvider, StreamEvent, StreamRequest } from "./provider";

/**
 * OpenAI 어댑터 — Phase 2 구현 예정. 현재는 stub.
 * 실제 구현 시 Responses API의 web_search_preview 도구를 사용하고,
 * SystemBlock.cache는 무시(자동 prefix caching).
 */
export class OpenAIProvider implements LlmProvider {
  readonly name = "openai" as const;
  async *streamChat(_req: StreamRequest): AsyncIterable<StreamEvent> {
    yield {
      type: "error",
      message:
        "OpenAI 공급자는 아직 구현되지 않았습니다. ENV LLM_PROVIDER=anthropic으로 설정해 주세요.",
    };
  }
}
