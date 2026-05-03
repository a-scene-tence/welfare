import type { LlmProvider } from "./provider";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";
import { UpstageProvider } from "./upstage";

export function getLlmProvider(opts?: { apiKey?: string }): LlmProvider {
  const name = (process.env.LLM_PROVIDER ?? "anthropic").toLowerCase();
  switch (name) {
    case "openai":
      return new OpenAIProvider();
    case "gemini":
      return new GeminiProvider();
    case "upstage":
      return new UpstageProvider({ apiKey: opts?.apiKey });
    case "anthropic":
    default:
      return new AnthropicProvider({ apiKey: opts?.apiKey });
  }
}

export type { LlmProvider } from "./provider";
