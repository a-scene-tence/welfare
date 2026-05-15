/**
 * 서버 전용 Supabase 클라이언트 (service role 키 사용).
 * 절대 클라이언트 번들에 포함되어서는 안 됨 — 라우트 핸들러/서버 컴포넌트에서만 import.
 *
 * `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 둘 다 설정된 경우에만 활성.
 * 미설정 시 null 반환 → logger가 stdout 모드로 graceful fallback.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let initialized = false;

export function getSupabase(): SupabaseClient | null {
  if (initialized) return cached;
  initialized = true;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
