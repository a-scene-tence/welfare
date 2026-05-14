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
import { loadAllPrograms, serializeProgram } from "@/lib/kb/loader";
import { filterPrograms } from "@/lib/kb/filter";
import { rateLimit } from "@/lib/ratelimit";
import { maskFreeText, maskProfile } from "@/lib/pii";
import {
  newSessionId,
  recordConsentLog,
  recordMetric,
} from "@/lib/logger";
import {
  extractTierBlock,
  extractUrls,
  isWhitelistedDomain,
  matchSidoInUrl,
  matchSigunguInUrl,
  tierBlockIsEmpty,
} from "@/lib/regionMatch";
import { findCentralProgramsInBlock } from "@/lib/centralPrograms";
import { fixSourceLinks } from "@/lib/sourceLinkFix";
import { stripUserSourcesSection } from "@/lib/stripSourcesSection";
import { dedupDuplicateSummary } from "@/lib/dedupSummary";

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

  const programs = loadAllPrograms();
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
      let finalCitations: string[] = [];
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
          maxTokens: 3500,
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
          } else if (event.type === "tool_use") {
            controller.enqueue(encoder.encode(sse({ type: "tool_use" })));
          } else if (event.type === "done") {
            inputTokens = event.usage?.inputTokens ?? 0;
            outputTokens = event.usage?.outputTokens ?? 0;
          } else if (event.type === "error") {
            errorType = "provider_error";
            controller.enqueue(encoder.encode(sse(event)));
          }
          // citation 이벤트는 무시 — 1.5단계: 본문에서 직접 추출하므로
        }

        // §36 / §37: 응답 본문 중복 (turn 0 + turn 1) 제거. dedupSummary 모듈 분리.
        const dedup = dedupDuplicateSummary(assembled);
        if (dedup.removed > 0) {
          assembled = dedup.result;
          console.info(
            "[chat] dedup_duplicate_summary removed",
            dedup.removed,
            "newLen",
            assembled.length,
          );
        }

        // 응답 말미 면책 강제 추가
        if (
          !assembled.includes("보건복지상담센터") &&
          !assembled.includes("129")
        ) {
          const disclaimerEvent = {
            type: "text_delta",
            text: DISCLAIMER_BLOCKQUOTE,
          };
          assembled += DISCLAIMER_BLOCKQUOTE;
          controller.enqueue(encoder.encode(sse(disclaimerEvent)));
        }

        // §27 A: LLM 이 본문 끝에 직접 작성한 「참고한 공식 출처」 평문 섹션 제거.
        // SourceCitations 컴포넌트가 done 이벤트 citations 배열로 동일 헤더를 자동
        // 렌더링하므로 중복 방지.
        const stripped = stripUserSourcesSection(assembled);
        if (stripped.removed) {
          assembled = stripped.result;
          console.info("[chat] stripped user sources section");
        }

        // §27 B / 1.7단계: 본문 후처리 — "출처: 도메인" 텍스트를 markdown 링크로
        // 자동 재작성. AGENCY_DOMAIN_MAP 의 fallback URL 도 적용되므로 본문에
        // 도메인 URL 이 없어도 변환됨. § 29 Fix-1 에 따라 tier 검증보다 먼저 실행.
        const linkFix = fixSourceLinks(assembled);
        if (linkFix.replaced > 0) {
          assembled = linkFix.result;
          console.info("[chat] sourceLinkFix replaced", linkFix.replaced);
        }

        // §29 Fix-1: 거주지 도메인 검증 (② 광역 / ③ 시·군·구).
        // fixSourceLinks 가 fallback URL 을 본문에 삽입한 후 검증해야 markdown
        // 링크 변환 효과가 검증에 반영됨.
        const tier2Block = extractTierBlock(assembled, 2);
        if (tier2Block && !tierBlockIsEmpty(tier2Block)) {
          const tier2Urls = extractUrls(tier2Block);
          const matched = tier2Urls.some((u) =>
            matchSidoInUrl(profile.region.sido, u),
          );
          if (!matched) {
            const warning =
              `\n\n> ⚠ **자동 검증 경고**: ② ${profile.region.sido} 안내된 사업의 인용 URL 에 ` +
              `${profile.region.sido} 공식 도메인이 확인되지 않았습니다. 시행 여부와 자격은 ` +
              `반드시 ${profile.region.sido} 또는 보건복지상담센터(129)에 확인하세요.\n`;
            controller.enqueue(
              encoder.encode(sse({ type: "text_delta", text: warning })),
            );
            assembled += warning;
            console.info(
              `[chat] tier2_no_match sido=${profile.region.sido}`,
              `blockLen=${tier2Block.length}`,
              `urls=${tier2Urls.length}`,
              `head=${JSON.stringify(tier2Block.slice(0, 120))}`,
            );
          }
        }

        const tier3Block = extractTierBlock(assembled, 3);
        if (tier3Block && !tierBlockIsEmpty(tier3Block)) {
          const tier3Urls = extractUrls(tier3Block);
          const matched = tier3Urls.some((u) =>
            matchSigunguInUrl(profile.region.sigungu, u),
          );
          if (!matched) {
            const warning =
              `\n\n> ⚠ **자동 검증 경고**: ③ ${profile.region.sigungu} 안내된 사업의 인용 URL 에 ` +
              `${profile.region.sigungu} 공식 도메인이 확인되지 않았습니다. 시행 여부와 자격은 ` +
              `반드시 ${profile.region.sigungu} 행정복지센터 또는 보건복지상담센터(129)에 확인하세요.\n`;
            controller.enqueue(
              encoder.encode(sse({ type: "text_delta", text: warning })),
            );
            assembled += warning;
            console.info(
              `[chat] tier3_no_match sigungu=${profile.region.sigungu}`,
              `blockLen=${tier3Block.length}`,
              `urls=${tier3Urls.length}`,
              `head=${JSON.stringify(tier3Block.slice(0, 120))}`,
            );
          }
        }

        // 1.7단계: 계층 중복 분류 검증 — ② ③ 블록에 중앙부처 사업명이 등장하면 자동 경고.
        const tier2BlockOverlap = extractTierBlock(assembled, 2);
        if (tier2BlockOverlap && !tierBlockIsEmpty(tier2BlockOverlap)) {
          const overlaps = findCentralProgramsInBlock(tier2BlockOverlap);
          if (overlaps.length > 0) {
            const warning =
              `\n\n> ⚠ **자동 검증 경고**: ② ${profile.region.sido} 사업으로 안내된 항목 중 ` +
              `「${overlaps.join("·")}」은(는) 중앙부처(보건복지부·고용노동부·국토교통부 등)가 운영하는 ` +
              `전국 공통 사업입니다. ① 중앙정부 사업으로 간주하시고, 신청 시 ${profile.region.sido} ` +
              `또는 소관 기관에 자격을 확인하세요.\n`;
            controller.enqueue(
              encoder.encode(sse({ type: "text_delta", text: warning })),
            );
            assembled += warning;
            console.info(
              `[chat] tier2_central_overlap`,
              JSON.stringify(overlaps),
              `blockLen=${tier2BlockOverlap.length}`,
              `tail=${JSON.stringify(tier2BlockOverlap.slice(-150))}`,
            );
          }
        }

        const tier3BlockOverlap = extractTierBlock(assembled, 3);
        if (tier3BlockOverlap && !tierBlockIsEmpty(tier3BlockOverlap)) {
          const overlaps = findCentralProgramsInBlock(tier3BlockOverlap);
          if (overlaps.length > 0) {
            const warning =
              `\n\n> ⚠ **자동 검증 경고**: ③ ${profile.region.sigungu} 사업으로 안내된 항목 중 ` +
              `「${overlaps.join("·")}」은(는) 중앙부처가 운영하는 전국 공통 사업입니다. ` +
              `① 중앙정부 사업으로 간주하시고, ${profile.region.sigungu} 자체 사업 여부는 ` +
              `${profile.region.sigungu} 행정복지센터에 확인하세요.\n`;
            controller.enqueue(
              encoder.encode(sse({ type: "text_delta", text: warning })),
            );
            assembled += warning;
            console.info(
              `[chat] tier3_central_overlap`,
              JSON.stringify(overlaps),
              `blockLen=${tier3BlockOverlap.length}`,
              `tail=${JSON.stringify(tier3BlockOverlap.slice(-150))}`,
            );
          }
        }

        // 1.5단계: citations 재구성 — 본문에서 인용된 화이트리스트 URL 만 표시
        finalCitations = extractUrls(assembled).filter(isWhitelistedDomain);
        console.info(
          "[chat] citations from body",
          finalCitations.length,
        );

        controller.enqueue(
          encoder.encode(
            sse({
              type: "done",
              citations: finalCitations,
              finalMarkdown: assembled,
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
              citations: finalCitations,
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
