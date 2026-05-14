/**
 * 거주지 도메인 매칭 유틸 — LLM 응답 본문에서 ② 광역시도 / ③ 기초자치단체 사업이
 * 거주지 공식 도메인 출처를 인용했는지 deterministic 검증.
 */

const SIGUNGU_ROMAN: Record<string, string[]> = {
  // 서울 자치구 (25개)
  강남구: ["gangnam"],
  강동구: ["gangdong"],
  강북구: ["gangbuk"],
  강서구: ["gangseo"],
  관악구: ["gwanak"],
  광진구: ["gwangjin"],
  구로구: ["guro"],
  금천구: ["geumcheon"],
  노원구: ["nowon"],
  도봉구: ["dobong"],
  동대문구: ["dongdaemun"],
  동작구: ["dongjak"],
  마포구: ["mapo"],
  서대문구: ["seodaemun"],
  서초구: ["seocho"],
  성동구: ["seongdong"],
  성북구: ["seongbuk"],
  송파구: ["songpa"],
  양천구: ["yangcheon"],
  영등포구: ["yeongdeungpo"],
  용산구: ["yongsan"],
  은평구: ["eunpyeong"],
  종로구: ["jongno"],
  중구: ["junggu", "jung-gu"],
  중랑구: ["jungnang"],
  // 부산 자치구
  동래구: ["dongnae"],
  수영구: ["suyeong"],
  사하구: ["saha"],
  해운대구: ["haeundae"],
  사상구: ["sasang"],
  기장군: ["gijang"],
  영도구: ["yeongdo"],
  부산진구: ["busanjin"],
  연제구: ["yeonje"],
  금정구: ["geumjeong"],
  // 대구
  달서구: ["dalseo"],
  달성군: ["dalseong"],
  수성구: ["suseong"],
  // 인천
  계양구: ["gyeyang"],
  남동구: ["namdong"],
  부평구: ["bupyeong"],
  연수구: ["yeonsu"],
  옹진군: ["ongjin"],
  강화군: ["ganghwa"],
  미추홀구: ["michuhol"],
  // 광주
  광산구: ["gwangsan"],
  // 대전
  대덕구: ["daedeok"],
  유성구: ["yuseong"],
  // 울산
  울주군: ["ulju"],
  // 광역시 공통 자치구 — 동/서/남/북
  동구: ["donggu", "dong-gu"],
  서구: ["seogu", "seo-gu"],
  남구: ["namgu", "nam-gu"],
  북구: ["bukgu", "buk-gu"],
  // 경기도 주요 시
  수원시: ["suwon"],
  성남시: ["seongnam"],
  안양시: ["anyang"],
  부천시: ["bucheon"],
  광명시: ["gwangmyeong"],
  평택시: ["pyeongtaek"],
  안산시: ["ansan"],
  고양시: ["goyang"],
  과천시: ["gwacheon"],
  구리시: ["guri"],
  남양주시: ["namyangju"],
  오산시: ["osan"],
  시흥시: ["siheung"],
  군포시: ["gunpo"],
  의왕시: ["uiwang"],
  하남시: ["hanam"],
  용인시: ["yongin"],
  파주시: ["paju"],
  이천시: ["icheon"],
  안성시: ["anseong"],
  김포시: ["gimpo"],
  화성시: ["hwaseong"],
  양주시: ["yangju"],
  포천시: ["pocheon"],
  여주시: ["yeoju"],
  동두천시: ["dongducheon"],
  의정부시: ["uijeongbu"],
  양평군: ["yangpyeong"],
  가평군: ["gapyeong"],
  연천군: ["yeoncheon"],
};

const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

const SIDO_ROMAN: Record<string, string[]> = {
  서울: ["seoul"],
  부산: ["busan"],
  대구: ["daegu"],
  인천: ["incheon"],
  광주: ["gwangju"],
  대전: ["daejeon"],
  울산: ["ulsan"],
  세종: ["sejong"],
  경기: ["gg.go.kr", "gyeonggi"],
  강원: ["gangwon"],
  충북: ["chungbuk", "chungcheongbuk"],
  충남: ["chungnam", "chungcheongnam"],
  전북: ["jeonbuk", "jeollabuk"],
  전남: ["jeonnam", "jeollanam"],
  경북: ["gb.go.kr", "gyeongbuk", "gyeongsangbuk"],
  경남: ["gyeongnam", "gyeongsangnam"],
  제주: ["jeju"],
};

/**
 * URL 호스트·경로에 해당 시·군·구 명칭(한글 또는 로마자)이 포함되는지 검사.
 * 매칭 우선순위: 한글 전체 → 한글 stem(접미 구/군/시 제거) → 로마자 alias.
 */
export function matchSigunguInUrl(sigungu: string, url: string): boolean {
  const lcUrl = url.toLowerCase();
  if (url.includes(sigungu)) return true;
  const stem = sigungu.replace(/[구군시]$/, "");
  if (stem !== sigungu && stem.length >= 2 && url.includes(stem)) return true;
  const romans = SIGUNGU_ROMAN[sigungu] ?? [];
  for (const r of romans) {
    if (lcUrl.includes(r)) return true;
  }
  return false;
}

/**
 * URL 호스트·경로에 해당 광역시도 명칭(한글 또는 로마자)이 포함되는지 검사.
 */
export function matchSidoInUrl(sido: string, url: string): boolean {
  const short =
    SIDO_SHORT[sido] ??
    sido.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "");
  if (url.includes(short)) return true;
  const romans = SIDO_ROMAN[short] ?? [];
  const lcUrl = url.toLowerCase();
  for (const r of romans) {
    if (lcUrl.includes(r)) return true;
  }
  return false;
}

const URL_RE = /https?:\/\/[^\s)>\]}'"< ]+/g;

/** 텍스트에서 모든 http(s) URL 추출 (중복 제거). markdown 링크와 bare URL 모두 처리. */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_RE) ?? [];
  // markdown 링크 끝의 ) 가 잘리지 않도록 끝 punctuation 정리
  const cleaned = matches.map((u) => u.replace(/[.,;:!?]+$/, ""));
  return Array.from(new Set(cleaned));
}

const ALLOWED_DOMAIN_SUFFIXES = [".go.kr", ".or.kr", "korea.kr"];

/** 화이트리스트 도메인(.go.kr / .or.kr / korea.kr) 인지 검사. */
export function isWhitelistedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_DOMAIN_SUFFIXES.some(
      (s) => host.endsWith(s) || host === s.replace(/^\./, ""),
    );
  } catch {
    return false;
  }
}

/**
 * 응답 본문에서 ② 또는 ③ 계층 블록 추출.
 * 시작: "②" / "③" 첫 등장 위치
 * 끝: 다음 "③" (tier 2 의 경우) 또는 "## " H2 헤딩 또는 EOF
 */
export function extractTierBlock(
  markdown: string,
  tier: 2 | 3,
): string | null {
  const marker = tier === 2 ? "②" : "③";
  const idx = markdown.indexOf(marker);
  if (idx === -1) return null;

  let end = markdown.length;
  if (tier === 2) {
    const nextIdx = markdown.indexOf("③", idx + 1);
    if (nextIdx !== -1) end = Math.min(end, nextIdx);
  }
  if (tier === 3) {
    // ④ 다음 단계 마커로도 종료
    const nextSection = markdown.indexOf("④", idx + 1);
    if (nextSection !== -1) end = Math.min(end, nextSection);
  }

  // §32 Fix-A: `\n## ` H2 헤딩 종료 마커는 제거. LLM 이 ② 블록 안에서 사업명을
  // ## / ### H 헤딩으로 작성하는 패턴이 일반적이라 ② 블록을 첫 사업 시작 지점에서
  // 일찍 종료시키는 회귀가 발생. ②③④ 마커 + 평문 번호 헤딩(\n\d+\.\s) 으로 충분.

  // §34: "3. 다음 단계" 처럼 단계 헤딩만 종료 마커로 인식.
  // §33 의 거리 조건 200자는 ③ 블록이 "다음 단계" 섹션을 흡수하면서 그 안의
  // 중앙 사업명(버팀목·기초연금 등) 이 _central_overlap false positive 를 일으킴.
  // ② 블록 안의 "1. 사업명" ordered list 는 "다음 단계" 가 아니므로 매치 안 됨.
  const remaining = markdown.slice(idx);
  const numberHeadingMatch = remaining.match(/\n\d+\.\s*다음\s*단계/);
  if (numberHeadingMatch && numberHeadingMatch.index !== undefined) {
    const numberEnd = idx + numberHeadingMatch.index;
    if (numberEnd < end) end = numberEnd;
  }

  return markdown.slice(idx, end);
}

/**
 * 계층 블록이 "확인된 사업 없음" 등 보류 상태로 시작했는지 검사.
 *
 * 매치 범위는 블록 첫 300자만. 응답 본문 끝의 leak 된 ⚠ 경고 메시지나 면책 안의
 * "확인된 사업 없음" 문자열에 false match 되는 것을 차단하기 위함.
 */
export function tierBlockIsEmpty(block: string): boolean {
  const head = block.slice(0, 300);
  return /확인된\s*사업\s*없음|해당.{0,30}없음|확인\s*결과.{0,60}(없음|미확인|불명)/.test(
    head,
  );
}
