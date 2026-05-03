/**
 * Opt-in 동의자 한정으로 비식별 대화 이력을 Supabase에 저장하는 모듈.
 * - 동의 없는 요청은 메트릭(시도·소요시간·토큰수)만 stdout 또는 welfare_metric 테이블에.
 * - 동의자는 마스킹된 프로필과 응답을 30일 TTL로 welfare_consent_log에 저장.
 *
 * `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY` 미설정 시 stdout만 사용 (서비스는 정상 동작).
 */
import { randomUUID } from "node:crypto";
import { getSupabase } from "./supabase";
import type { MaskedProfile } from "./pii";

export type LogEntry = {
  sessionId: string;
  createdAt: string; // ISO
  sido: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  errorType?: string;
};

export type ConsentLogEntry = LogEntry & {
  maskedProfile: MaskedProfile;
  /** 응답 본문도 PII 정규식으로 다시 마스킹 후 저장. */
  maskedResponse: string;
  citations: string[];
};

const TTL_DAYS = 30;

export function newSessionId(): string {
  return randomUUID();
}

export async function recordMetric(entry: LogEntry): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    console.info("[metric]", JSON.stringify(entry));
    return;
  }
  const { error } = await sb.from("welfare_metric").insert({
    session_id: entry.sessionId,
    created_at: entry.createdAt,
    sido: entry.sido,
    latency_ms: entry.latencyMs,
    tokens_in: entry.tokensIn,
    tokens_out: entry.tokensOut,
    error_type: entry.errorType ?? null,
  });
  if (error) {
    console.error("[metric insert]", error.message);
  }
}

export async function recordConsentLog(entry: ConsentLogEntry): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    console.info("[consent_log_stub]", entry.sessionId, entry.sido);
    return;
  }
  const expiresAt = new Date(
    Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error } = await sb.from("welfare_consent_log").insert({
    session_id: entry.sessionId,
    created_at: entry.createdAt,
    expires_at: expiresAt,
    sido: entry.sido,
    latency_ms: entry.latencyMs,
    tokens_in: entry.tokensIn,
    tokens_out: entry.tokensOut,
    error_type: entry.errorType ?? null,
    masked_profile: entry.maskedProfile,
    masked_response: entry.maskedResponse,
    citations: entry.citations,
  });
  if (error) {
    console.error("[consent_log insert]", error.message);
  }
}
