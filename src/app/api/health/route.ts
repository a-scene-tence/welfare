import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const llmProvider = process.env.LLM_PROVIDER ?? "anthropic";

  const checks = {
    llm: {
      provider: llmProvider,
      configured: hasLlmKey(llmProvider),
    },
    tavily: { configured: Boolean(process.env.TAVILY_API_KEY) },
    supabase: { configured: Boolean(getSupabase()) },
  };

  const ok = checks.llm.configured;

  return Response.json(
    {
      ok,
      service: "welfare",
      time: new Date().toISOString(),
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}

function hasLlmKey(provider: string): boolean {
  switch (provider) {
    case "upstage":
      return Boolean(process.env.UPSTAGE_API_KEY);
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY);
    case "gemini":
      return Boolean(process.env.GEMINI_API_KEY);
    case "anthropic":
    default:
      return Boolean(process.env.ANTHROPIC_API_KEY);
  }
}
