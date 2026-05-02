import type { LlmProvider, StreamEvent, StreamRequest } from "./provider";

/**
 * Gemini 어댑터 — Phase 2 구현 예정. 현재는 stub.
 * 실제 구현 시 google_search grounding을 사용.
 */
export class GeminiProvider implements LlmProvider {
  readonly name = "gemini" as const;
  async *streamChat(_req: StreamRequest): AsyncIterable<StreamEvent> {
    yield {
      type: "error",
      message:
        "Gemini 공급자는 아직 구현되지 않았습니다. ENV LLM_PROVIDER=anthropic으로 설정해 주세요.",
    };
  }
}
