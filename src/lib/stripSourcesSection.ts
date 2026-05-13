/**
 * LLM 응답 본문 끝에 작성된 「참고한 공식 출처」 / 「출처 목록」 / 「Sources」 등의
 * 평문 섹션을 제거.
 *
 * SourceCitations 컴포넌트가 done 이벤트의 citations 배열로 동일 헤더를 자동
 * 렌더링하므로 LLM 의 평문 섹션과 중복된다. system.ko.ts 의 안내 강화로는 LLM
 * 행동을 보장할 수 없어 서버 후처리로 강제 제거.
 *
 * 면책 박스(`>`)와 자동 경고(`⚠`) 라인은 제거 대상에서 제외하기 위해 다음 면책/
 * 경고/구분선 만나면 잘라내기를 종료한다.
 */

const HEADER_RE =
  /(?:^|\n)\s*(?:#+\s*)?(?:\*{1,2})?(?:참고한\s*공식\s*출처|출처\s*목록|참고\s*출처|Sources)(?:\*{1,2})?\s*[:：]?(?:\*{1,2})?\s*\n/i;

export function stripUserSourcesSection(markdown: string): {
  result: string;
  removed: boolean;
} {
  const match = markdown.match(HEADER_RE);
  if (!match || match.index === undefined) {
    return { result: markdown, removed: false };
  }

  const headerStart = match.index;
  const headerEnd = match.index + match[0].length;
  const tail = markdown.slice(headerEnd);

  let sectionEnd = headerEnd;
  for (const line of tail.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(">") || trimmed.startsWith("⚠") || trimmed.startsWith("---")) {
      break;
    }
    sectionEnd += line.length + 1;
  }

  const result = markdown.slice(0, headerStart) + markdown.slice(sectionEnd);
  return { result, removed: true };
}
