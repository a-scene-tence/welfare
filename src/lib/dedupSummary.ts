/**
 * §36 / §37: turn 0 에서 LLM 이 text + tool_calls 동시 emit 시 turn 1 의 응답이
 * 처음부터 다시 작성되어 본문 중복. "1. 자격 요약" 헤더가 두 번 이상 등장하면
 * 두 번째 헤더부터 응답 끝까지만 유지 (turn 1 의 tool 기반 응답이 더 정확).
 *
 * §37: `\n` 시작 anchor → `(?:^|\n)` 로 응답 시작 위치도 매치.
 */

const SUMMARY_HEADER_RE =
  /(?:^|\n)(?:#+\s*)?(?:\*{1,2})?1\.\s*자격\s*요약/g;

export function dedupDuplicateSummary(markdown: string): {
  result: string;
  removed: number;
} {
  const matches = [...markdown.matchAll(SUMMARY_HEADER_RE)];
  if (matches.length < 2 || matches[1].index === undefined) {
    return { result: markdown, removed: 0 };
  }
  const removed = matches[1].index;
  const result = markdown.slice(removed).replace(/^\s*\n+/, "");
  return { result, removed };
}
