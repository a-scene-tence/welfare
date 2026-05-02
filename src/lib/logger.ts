/**
 * Opt-in 동의자 한정으로 비식별 대화 이력을 저장하는 모듈.
 * - 동의 없는 요청은 메트릭(시도·소요시간·토큰수)만 stdout 로그에 남기고 DB 미접근.
 * - 동의자는 마스킹된 프로필과 응답을 30일 TTL로 DB에 저장(추후 별도 스크립트로 폐기).
 *
 * 본 파일은 인터페이스만 제공하며, DB 클라이언트(Postgres/Supabase)는
 * Phase 2에서 ENV(`DATABASE_URL`)가 채워질 때 활성화한다.
 */
import { randomUUID } from "node:crypto";
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

export function newSessionId(): string {
  return randomUUID();
}

export async function recordMetric(entry: LogEntry): Promise<void> {
  // DB 비활성 시: 운영 모니터링용 한 줄 로그만 출력 (입력값 없음)
  if (!process.env.DATABASE_URL) {
    console.info("[metric]", JSON.stringify(entry));
    return;
  }
  // TODO(Phase 2): Postgres insert into welfare_metric
}

export async function recordConsentLog(entry: ConsentLogEntry): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.info("[consent_log_stub]", entry.sessionId, entry.sido);
    return;
  }
  // TODO(Phase 2): Postgres insert into welfare_consent_log (with 30d TTL job)
}
