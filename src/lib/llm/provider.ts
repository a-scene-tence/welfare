/**
 * 공급자 비종속 LLM 인터페이스. 추후 Anthropic/OpenAI/Gemini를 ENV로 스왑.
 */

export type SystemBlock = {
  text: string;
  /** 캐시 가능 블록(공급자별로 prompt caching 적용). 기본 false. */
  cache?: boolean;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type WebSearchTool = {
  type: "web_search";
  maxUses?: number;
  allowedDomains?: string[];
};

export type LlmTool = WebSearchTool;

export type StreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_use"; name: string; input: unknown }
  | { type: "citation"; url: string; title?: string }
  | { type: "done"; usage?: { inputTokens: number; outputTokens: number } }
  | { type: "error"; message: string };

export type StreamRequest = {
  system: SystemBlock[];
  messages: ChatMessage[];
  tools?: LlmTool[];
  maxTokens: number;
  temperature: number;
  signal?: AbortSignal;
  /** BYOK 사용 시 사용자 키. 기본은 ENV 키. */
  apiKey?: string;
};

export interface LlmProvider {
  readonly name: "anthropic" | "openai" | "gemini";
  streamChat(req: StreamRequest): AsyncIterable<StreamEvent>;
}
