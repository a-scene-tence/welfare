import { test, expect } from "@playwright/test";
import { PERSONAS } from "./__fixtures__/personas";

/**
 * P1·P2·P3 페르소나 회귀 E2E.
 *
 * POST /api/chat 를 SSE 스트림으로 호출 → 최종 assembled markdown 받아
 * §24~§39 회귀 fix 가 모두 통과되는지 metric 검증.
 *
 * 실제 LLM (Upstage) + Tavily 호출 발생 — nightly 또는 manual trigger only.
 */

type DoneEvent = {
  type: "done";
  citations: string[];
  finalMarkdown: string;
  tokens?: { input?: number; output?: number };
};

async function streamChat(baseURL: string, body: object): Promise<DoneEvent> {
  const res = await fetch(`${baseURL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error(`POST /api/chat failed: HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done: DoneEvent | null = null;

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });

    let sepIdx: number;
    while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const event = JSON.parse(payload);
          if (event.type === "done") done = event as DoneEvent;
        } catch {
          // ignore parse error
        }
      }
    }
  }

  if (!done) throw new Error("Stream ended without 'done' event");
  return done;
}

function countOccurrences(haystack: string, needle: RegExp): number {
  return (haystack.match(needle) ?? []).length;
}

for (const persona of PERSONAS) {
  test(`${persona.name} - 회귀 metric 통과`, async ({ baseURL }) => {
    test.setTimeout(180_000);
    const done = await streamChat(baseURL!, { profile: persona.profile, messages: [] });

    const md = done.finalMarkdown;

    // 1. 응답 본문이 비어 있지 않음 (§24 빈 응답 본문 버그 회귀 차단)
    expect(md.length).toBeGreaterThan(1500);

    // 2. ⚠ 자동 검증 경고 0건 (모든 tier 검증 통과)
    expect(countOccurrences(md, /⚠\s*\*?\*?자동 검증 경고/g)).toBe(0);

    // 3. "1. 자격 요약" 1회만 등장 (§36/§37 응답 중복 차단)
    expect(countOccurrences(md, /(?:^|\n)(?:#+\s*)?(?:\*{1,2})?1\.\s*자격\s*요약/g)).toBe(1);

    // 4. 본문에 markdown 링크 6개 이상
    expect(countOccurrences(md, /\[[^\]]+\]\(https?:\/\/[^)]+\)/g)).toBeGreaterThanOrEqual(6);

    // 5. ② / ③ 마커 등장 (계층 사업 안내 정상)
    expect(md).toContain("② ");
    expect(md).toContain("③ ");

    // 6. citations 응답 (done event citations 배열 — 화이트리스트 URL)
    expect(done.citations.length).toBeGreaterThanOrEqual(3);
  });
}
