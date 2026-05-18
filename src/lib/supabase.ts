/**
 * 서버 전용 Supabase 클라이언트 (service role 키 사용).
 * 절대 클라이언트 번들에 포함되어서는 안 됨 — 라우트 핸들러/서버 컴포넌트에서만 import.
 *
 * `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 둘 다 설정된 경우에만 활성.
 * 미설정 시 null 반환 → logger가 stdout 모드로 graceful fallback.
 *
 * 환경 변수 값은 모든 whitespace (공백 / 탭 / 줄바꿈 / 캐리지 리턴) 를 제거 후 사용.
 * Vercel·Render 등 일부 호스팅에서 환경 변수 복사 시 trailing newline 이 포함되어
 * Headers.set 가 "invalid header value" 로 거부하는 회귀를 방지.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let initialized = false;

/** Strip every whitespace character (incl. \n, \r, \t, space). Supabase URL / key
 *  은 base64-like 문자만 포함하므로 안전. */
function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const sanitized = value.replace(/\s+/g, "");
  return sanitized.length > 0 ? sanitized : undefined;
}

export function getSupabase(): SupabaseClient | null {
  if (initialized) return cached;
  initialized = true;

  const url = sanitizeEnv(process.env.SUPABASE_URL);
  const key = sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) {
    cached = null;
    return null;
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
    global: { headers: { "X-Client-Info": "welfare-agent/1.0" } },
  });
  return cached;
}
