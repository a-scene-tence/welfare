/**
 * 중앙부처가 운영·법령 근거를 가진 전국 공통 사업 키워드 화이트리스트.
 *
 * ② 광역시도 / ③ 기초자치단체 블록에 다음 키워드가 등장하면 계층 중복 분류로
 * 간주, 서버측에서 자동 ⚠ 경고를 첨부한다. 시스템 프롬프트(system.ko.ts §5
 * "계층 분류 규칙") 와 동기화 유지.
 */
export const CENTRAL_PROGRAM_KEYWORDS: string[] = [
  // 노인·장애·돌봄
  "기초연금",
  "노인맞춤돌봄",
  "노인장기요양",
  "노인일자리 및 사회활동",
  "노인일자리",
  "장애인연금",
  "장애수당",
  "장애인활동지원",

  // 청년·고용
  "국민취업지원",
  "청년도약계좌",
  "청년월세 한시",
  "청년내일채움공제",

  // 주거 (국토교통부)
  "버팀목",
  "디딤돌",
  "신생아 특례",

  // 의료·건강
  "본인부담상한제",
  "재난적의료비",

  // 양육·가족
  "부모급여",
  "아동수당",
  "한부모가족 양육비",
  "다문화가족 지원",

  // 에너지·생활
  "에너지바우처",

  // 세제 (국세청)
  "근로장려금",
  "자녀장려금",

  // 기초생활보장 (보건복지부)
  "국민기초생활보장",
  "생계급여",
  "의료급여",
  "주거급여",
  "교육급여",
  "기초생활수급",
];

/**
 * 텍스트 블록에서 중앙부처 사업명 키워드 등장 여부를 검사.
 *
 * 매칭 범위는 블록 첫 1500자. 블록 끝의 면책·경고 메시지에 false match 되는 것을
 * 차단하기 위함. §35: 라인 단위 검사 + 광역·구 가산 부속 표기 라인 제외.
 * 「부산 노인일자리 (광역 가산)」 같이 정당하게 ②③ 에 분류된 가산 사업명에
 * 포함된 중앙 키워드("노인일자리" 등) 가 잘못 매칭되는 것을 차단.
 *
 * @returns 등장한 키워드 목록(중복 제거).
 */
const SUFFIX_RE =
  /\((광역\s*가산|구\s*가산|시\s*가산|특별시\s*가산|자치구\s*가산)\)/;

export function findCentralProgramsInBlock(block: string): string[] {
  const head = block.slice(0, 1500);
  const found = new Set<string>();
  // §38 Fix-B: 사업 블록 단위 skip. 사업명 라인이 SUFFIX_RE 매치 시 그 사업의
  // 후속 라인(자격·혜택·신청 시기 등) 도 함께 skip — 가산 사업의 혜택 라인에
  // 자연 등장하는 중앙 사업명 키워드가 false positive 일으키지 않도록.
  const NEW_PROGRAM_RE = /^\s*(?:\d+\.\s|[①②③④]|[*-]\s)/;
  let skipUntilNextProgram = false;
  for (const line of head.split("\n")) {
    if (NEW_PROGRAM_RE.test(line)) {
      skipUntilNextProgram = SUFFIX_RE.test(line);
      if (skipUntilNextProgram) continue;
    }
    if (skipUntilNextProgram) continue;
    if (SUFFIX_RE.test(line)) continue;
    for (const keyword of CENTRAL_PROGRAM_KEYWORDS) {
      if (line.includes(keyword)) found.add(keyword);
    }
  }
  return Array.from(found);
}
