/**
 * 간단한 인메모리 sliding-window rate limiter. 단일 서버리스 인스턴스 기준이라
 * 정확한 글로벌 제한은 아니지만 무료 티어에서 BYOK 미사용 사용자의 비용 폭증을
 * 1차로 막는 용도. Phase 2에서 Upstash Redis로 교체 가능.
 */

type Window = { times: number[] };
const store = new Map<string, Window>();
const MAX = Number(process.env.RATELIMIT_PER_HOUR ?? "10");
const WINDOW_MS = 60 * 60 * 1000;

export function rateLimit(key: string): { ok: boolean; remaining: number; resetMs: number } {
  if (!key) return { ok: true, remaining: MAX, resetMs: 0 };
  const now = Date.now();
  const w = store.get(key) ?? { times: [] };
  w.times = w.times.filter((t) => now - t < WINDOW_MS);
  if (w.times.length >= MAX) {
    const oldest = w.times[0]!;
    return { ok: false, remaining: 0, resetMs: WINDOW_MS - (now - oldest) };
  }
  w.times.push(now);
  store.set(key, w);
  return { ok: true, remaining: MAX - w.times.length, resetMs: 0 };
}
