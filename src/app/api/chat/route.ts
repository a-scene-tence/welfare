import { NextRequest } from "next/server";
import { ChatRequestSchema } from "@/lib/schema";
import { getLlmProvider } from "@/lib/llm";
import { SYSTEM_PROMPT_KO } from "@/lib/prompts/system.ko";
import { buildUserPrompt } from "@/lib/prompts/buildUserPrompt";
import { DISCLAIMER_BLOCKQUOTE } from "@/lib/prompts/disclaimer";
import {
  WEB_SEARCH_ALLOWED_DOMAINS,
  WEB_SEARCH_DEFAULT_MAX_USES,
} from "@/lib/tools/webSearch";
import { loadCentralPrograms, serializeProgram } from "@/lib/kb/loader";
import { filterPrograms } from "@/lib/kb/filter";
import { rateLimit } from "@/lib/ratelimit";
import { maskFreeText, maskProfile } from "@/lib/pii";
import {
  newSessionId,
  recordConsentLog,
  recordMetric,
} from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "잘못된 요청 본문입니다." }), {
      status: 400,
    });
  }
  const parsed = ChatRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "입력 검증 실패", issues: parsed.error.issues }),
      { status: 400 },
    );
  }
  const { profile, messages, byokKey } = parsed.data;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (!byokKey) {
    const rl = rateLimit(ip);
    if (!rl.ok) {
      return new Response(
        JSON.stringify({
          error:
            "사용량 한도를 초과했습니다. 잠시 후 다시 시도하시거나 본인 API 키를 입력해 주세요.",
          resetMs: rl.resetMs,
        }),
        { status: 429 },
      );
    }
  }

  const programs = loadCentralPrograms();
  const candidates = filterPrograms(programs, profile);
  const kbSnippets =
    candidates.length > 0
      ? candidates.map(serializeProgram).join("\n\n---\n\n")
      : "(시드 KB에서 매칭된 항목 없음 — web_search로 직접 탐색)";

  const userPrompt = buildUserPrompt({
    profile,
    kbSnippets,
    currentYear: new Date().getFullYear(),
  });

  const provider = getLlmProvider();
  const sessionId = newSessionId();

  console.info("[chat] start", {
    sido: profile.region.sido,
    sigungu: profile.region.sigungu,
    sessionId,
    provider: provider.name,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      console.info("[chat] stream open", sessionId);
      let assembled = "";
      let firstDeltaLoggedAt: number | null = null;
      const citations: string[] = [];
      let inputTokens = 0;
      let outputTokens = 0;
      let errorType: string | undefined;
      try {
        controller.enqueue(encoder.encode(sse({ type: "start", sessionId })));
        console.info("[chat] provider begin", provider.name);
        for await (const event of provider.streamChat({
          system: [
            { text: SYSTEM_PROMPT_KO, cache: true },
            { text: kbSnippets, cache: true },
          ],
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user" as const, content: userPrompt },
          ],
          tools: [
            {
              type: "web_search",
              maxUses: WEB_SEARCH_DEFAULT_MAX_USES,
              allowedDomains: WEB_SEARCH_ALLOWED_DOMAINS,
            },
          ],
          maxTokens: 2048,
          temperature: 0.2,
          apiKey: byokKey,
        })) {
          if (event.type === "text_delta") {
            if (firstDeltaLoggedAt === null) {
              firstDeltaLoggedAt = Date.now();
              console.info(
                "[chat] first text_delta after",
                firstDeltaLoggedAt - startedAt,
                "ms",
              );
            }
            assembled += event.text;
            controller.enqueue(encoder.encode(sse(event)));
          } else if (event.type === "citation") {
            citations.push(event.url);
            controller.enqueue(encoder.encode(sse(event)));
          } else if (event.type === "tool_use") {
            controller.enqueue(encoder.encode(sse({ type: "tool_use" })));
          } else if (event.type === "done") {
            inputTokens = event.usage?.inputTokens ?? 0;
            outputTokens = event.usage?.outputTokens ?? 0;
          } else if (event.type === "error") {
            errorType = "provider_error";
            controller.enqueue(encoder.encode(sse(event)));
          }
        }

        // 응답 말미 면책 강제 추가
        if (
          !assembled.includes("보건복지상담센터") &&
          !assembled.includes("129")
        ) {
          const disclaimerEvent = { type: "text_delta", text: DISCLAIMER_BLOCKQUOTE };
          assembled += DISCLAIMER_BLOCKQUOTE;
          controller.enqueue(encoder.encode(sse(disclaimerEvent)));
        }

        controller.enqueue(
          encoder.encode(
            sse({
              type: "done",
              citations,
              tokens: { input: inputTokens, output: outputTokens },
            }),
          ),
        );
      } catch (err) {
        errorType = "stream_error";
        console.error("[chat] stream error", err);
        controller.enqueue(
          encoder.encode(
            sse({
              type: "error",
              message: err instanceof Error ? err.message : "알 수 없는 오류",
            }),
          ),
        );
      } finally {
        controller.close();
        const latencyMs = Date.now() - startedAt;
        console.info("[chat] done", {
          sessionId,
          latencyMs,
          tokensIn: inputTokens,
          tokensOut: outputTokens,
          errorType,
          assembledChars: assembled.length,
        });
        const baseLog = {
          sessionId,
          createdAt: new Date().toISOString(),
          sido: profile.region.sido,
          latencyMs,
          tokensIn: inputTokens,
          tokensOut: outputTokens,
          errorType,
        };
        try {
          if (profile.consent.storeAnonymizedLog) {
            await recordConsentLog({
              ...baseLog,
              maskedProfile: maskProfile(profile),
              maskedResponse: maskFreeText(assembled),
              citations,
            });
          } else {
            await recordMetric(baseLog);
          }
        } catch (logErr) {
          console.error("logger error", logErr);
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
