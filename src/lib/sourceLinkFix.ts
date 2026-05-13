/**
 * 응답 본문 후처리: 「출처:」, 「신청 경로:」 행의 한국어 기관·사이트명 텍스트를
 * markdown 링크 \`[기관명](URL)\` 로 자동 재작성.
 *
 * LLM 이 시스템 프롬프트의 markdown 링크 강제 규칙을 무시하고 "출처: 복지로 · 국토교통부"
 * 같은 도메인 텍스트만 적는 사례가 페르소나 회귀 3건 모두에서 관찰됨.
 * citation 본문 추출은 작동하므로 인용 목록은 정상이지만, 본문 가독성·재사용성이 떨어짐.
 * 본 모듈은 본문에 등장한 URL 들을 도메인 → URL 맵으로 만들어 같은 응답 안에 등장한
 * 기관명 텍스트를 markdown 링크로 변환.
 */

type AgencyEntry = {
  name: string;
  domains: string[];
  fallbackUrl?: string;
};

const AGENCY_DOMAIN_MAP: AgencyEntry[] = [
  // 통합 복지 정보
  { name: "국가법령정보센터", domains: ["law.go.kr"], fallbackUrl: "https://www.law.go.kr/" },
  { name: "공공데이터포털", domains: ["data.go.kr"], fallbackUrl: "https://www.data.go.kr/" },
  { name: "정책브리핑", domains: ["korea.kr"], fallbackUrl: "https://www.korea.kr/" },
  { name: "복지로", domains: ["bokjiro.go.kr"], fallbackUrl: "https://www.bokjiro.go.kr/" },
  { name: "정부24", domains: ["gov.kr"], fallbackUrl: "https://www.gov.kr/" },

  // 중앙부처
  { name: "보건복지부", domains: ["mohw.go.kr"], fallbackUrl: "https://www.mohw.go.kr/" },
  { name: "고용노동부", domains: ["moel.go.kr"], fallbackUrl: "https://www.moel.go.kr/" },
  { name: "국토교통부", domains: ["molit.go.kr"], fallbackUrl: "https://www.molit.go.kr/" },
  { name: "여성가족부", domains: ["mogef.go.kr"], fallbackUrl: "https://www.mogef.go.kr/" },
  { name: "농림축산식품부", domains: ["mafra.go.kr"], fallbackUrl: "https://www.mafra.go.kr/" },
  { name: "중소벤처기업부", domains: ["mss.go.kr"], fallbackUrl: "https://www.mss.go.kr/" },
  { name: "교육부", domains: ["moe.go.kr"], fallbackUrl: "https://www.moe.go.kr/" },
  { name: "행정안전부", domains: ["mois.go.kr"], fallbackUrl: "https://www.mois.go.kr/" },
  { name: "금융위원회", domains: ["fsc.go.kr"], fallbackUrl: "https://www.fsc.go.kr/" },
  { name: "국세청", domains: ["nts.go.kr", "hometax.go.kr"], fallbackUrl: "https://www.nts.go.kr/" },

  // 사업별 공식 사이트
  { name: "기초연금 공식 사이트", domains: ["basicpension.mohw.go.kr"], fallbackUrl: "https://basicpension.mohw.go.kr/" },
  { name: "주택도시기금 포털", domains: ["nhuf.molit.go.kr"], fallbackUrl: "https://nhuf.molit.go.kr/" },
  { name: "주택도시기금", domains: ["nhuf.molit.go.kr"], fallbackUrl: "https://nhuf.molit.go.kr/" },
  { name: "마이홈포털", domains: ["myhome.go.kr"], fallbackUrl: "https://www.myhome.go.kr/" },
  { name: "마이홈", domains: ["myhome.go.kr"], fallbackUrl: "https://www.myhome.go.kr/" },
  { name: "워크넷", domains: ["work24.go.kr", "work.go.kr"], fallbackUrl: "https://www.work24.go.kr/" },
  { name: "온라인청년센터", domains: ["youthcenter.go.kr"], fallbackUrl: "https://www.youthcenter.go.kr/" },
  { name: "청년몽땅정보통", domains: ["youth.seoul.go.kr"], fallbackUrl: "https://youth.seoul.go.kr/" },
  { name: "국민건강보험공단", domains: ["nhis.or.kr"], fallbackUrl: "https://www.nhis.or.kr/" },
  { name: "국민건강보험", domains: ["nhis.or.kr"], fallbackUrl: "https://www.nhis.or.kr/" },
  { name: "국민연금공단", domains: ["nps.or.kr"], fallbackUrl: "https://www.nps.or.kr/" },
  { name: "한국노인인력개발원", domains: ["kordi.or.kr"], fallbackUrl: "https://www.kordi.or.kr/" },
  { name: "한국주택금융공사", domains: ["hf.go.kr"], fallbackUrl: "https://www.hf.go.kr/" },
  { name: "한국토지주택공사", domains: ["lh.or.kr"], fallbackUrl: "https://www.lh.or.kr/" },
  { name: "LH", domains: ["lh.or.kr"], fallbackUrl: "https://www.lh.or.kr/" },
  { name: "홈택스", domains: ["hometax.go.kr"], fallbackUrl: "https://www.hometax.go.kr/" },
  { name: "국민취업지원제도", domains: ["work24.go.kr", "work.go.kr", "kua.go.kr"], fallbackUrl: "https://www.work24.go.kr/" },
  { name: "기초연금", domains: ["basicpension.mohw.go.kr"], fallbackUrl: "https://basicpension.mohw.go.kr/" },

  // 광역시도
  { name: "서울특별시", domains: ["seoul.go.kr"], fallbackUrl: "https://www.seoul.go.kr/" },
  { name: "서울주거포털", domains: ["housing.seoul.go.kr"], fallbackUrl: "https://housing.seoul.go.kr/" },
  { name: "부산광역시", domains: ["busan.go.kr"], fallbackUrl: "https://www.busan.go.kr/" },
  { name: "대구광역시", domains: ["daegu.go.kr"], fallbackUrl: "https://www.daegu.go.kr/" },
  { name: "인천광역시", domains: ["incheon.go.kr"], fallbackUrl: "https://www.incheon.go.kr/" },
  { name: "광주광역시청", domains: ["gwangju.go.kr"], fallbackUrl: "https://www.gwangju.go.kr/" },
  { name: "광주광역시", domains: ["gwangju.go.kr"], fallbackUrl: "https://www.gwangju.go.kr/" },
  { name: "대전광역시", domains: ["daejeon.go.kr"], fallbackUrl: "https://www.daejeon.go.kr/" },
  { name: "울산광역시", domains: ["ulsan.go.kr"], fallbackUrl: "https://www.ulsan.go.kr/" },
  { name: "세종특별자치시", domains: ["sejong.go.kr"], fallbackUrl: "https://www.sejong.go.kr/" },
  { name: "경기도", domains: ["gg.go.kr"], fallbackUrl: "https://www.gg.go.kr/" },

  // 기초자치단체 (시·군·구) — KB 가 정의된 곳만 등록
  { name: "노원구청", domains: ["nowon.kr"], fallbackUrl: "https://www.nowon.kr/" },
  { name: "서울특별시 노원구", domains: ["nowon.kr"], fallbackUrl: "https://www.nowon.kr/" },
  { name: "노원구", domains: ["nowon.kr"], fallbackUrl: "https://www.nowon.kr/" },
  { name: "동래구청", domains: ["dongnae.go.kr"], fallbackUrl: "https://www.dongnae.go.kr/" },
  { name: "부산광역시 동래구", domains: ["dongnae.go.kr"], fallbackUrl: "https://www.dongnae.go.kr/" },
  { name: "동래구", domains: ["dongnae.go.kr"], fallbackUrl: "https://www.dongnae.go.kr/" },
  { name: "동구청", domains: ["donggu.gwangju.kr"], fallbackUrl: "https://www.donggu.gwangju.kr/" },
  { name: "광주광역시 동구", domains: ["donggu.gwangju.kr"], fallbackUrl: "https://www.donggu.gwangju.kr/" },
];

// 긴 이름이 먼저 매칭되도록 정렬 (예: "광주광역시청" 이 "광주광역시" 보다 우선)
const SORTED_AGENCY_MAP = [...AGENCY_DOMAIN_MAP].sort(
  (a, b) => b.name.length - a.name.length,
);

const URL_RE = /https?:\/\/[^\s)>\]}'"< ]+/g;

function extractAllUrls(text: string): string[] {
  const matches = text.match(URL_RE) ?? [];
  return Array.from(new Set(matches.map((u) => u.replace(/[.,;:!?]+$/, ""))));
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostMatchesDomain(host: string, domain: string): boolean {
  const d = domain.toLowerCase();
  return host === d || host.endsWith("." + d) || host.includes(d);
}

/**
 * 본문 전체에서 도메인 → URL 맵 생성. 각 도메인의 첫 매칭 URL 사용.
 */
function buildDomainToUrl(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const url of extractAllUrls(text)) {
    const host = getHostname(url);
    if (!host) continue;
    if (!map.has(host)) map.set(host, url);
  }
  return map;
}

function findUrlForDomain(
  domainToUrl: Map<string, string>,
  domain: string,
): string | null {
  for (const [host, url] of domainToUrl) {
    if (hostMatchesDomain(host, domain)) return url;
  }
  return null;
}

// 「출처: <값>」 같은 단일행 라벨 + 값 매칭. 라벨 앞 글머리 기호 허용.
// `**출처:**` / `**출처**:` / `출처:` 등 markdown 강조 변형 모두 처리.
const SOURCE_LINE_RE =
  /^(\s*[-*]?\s*(?:\*+)?(?:출처|신청\s*경로)(?:\*+)?\s*[:：](?:\*+)?\s*)(.+)$/;

// 「출처:」 만 있고 값은 다음 줄(들)에 있는 multi-line 라벨 매칭.
const SOURCE_LABEL_ONLY_RE =
  /^\s*[-*]?\s*(?:\*+)?(?:출처|신청\s*경로)(?:\*+)?\s*[:：](?:\*+)?\s*$/;

// multi-line 시 값 라인 매칭. 들여쓰기 또는 sub-list 형태 (예: "  보건복지부 · 정책브리핑",
// "- 보건복지부", "* 정책브리핑") 모두 처리.
const SOURCE_VALUE_LINE_RE = /^(\s+|\s*[-*]\s+)(.+)$/;

/**
 * 토큰 분할 + 매핑 도메인 → 본문 URL 매칭으로 markdown 링크 치환.
 * 라벨 라인의 value 또는 multi-line value 라인 모두에 재사용.
 */
function transformTokens(
  value: string,
  domainToUrl: Map<string, string>,
  bumpReplaced: () => void,
): string {
  return value.replace(/([^·/\n]+)/g, (token) => {
    const trimmed = token.trim();
    if (!trimmed) return token;
    if (token.includes("](") || /^https?:\/\//i.test(trimmed)) return token;

    // 토큰 안의 markdown bold 강조(`**부산광역시**`) 제거 후 매칭.
    const unbolded = token.replace(/\*+/g, "");

    for (const { name, domains, fallbackUrl } of SORTED_AGENCY_MAP) {
      if (!unbolded.includes(name)) continue;
      for (const domain of domains) {
        const url = findUrlForDomain(domainToUrl, domain);
        if (!url) continue;
        bumpReplaced();
        return token.includes(name)
          ? token.replace(name, `[${name}](${url})`)
          : token.replace(/\*+/g, "").replace(name, `[${name}](${url})`);
      }
      // 본문에 도메인 URL 이 없으면 화이트리스트 fallback URL 사용.
      // LLM 이 "출처: 국토교통부" 같이 도메인 이름만 적은 경우 보완.
      if (fallbackUrl) {
        bumpReplaced();
        return token.includes(name)
          ? token.replace(name, `[${name}](${fallbackUrl})`)
          : token.replace(/\*+/g, "").replace(name, `[${name}](${fallbackUrl})`);
      }
    }
    return token;
  });
}

/**
 * 「출처: 복지로 · 국토교통부」 패턴(single-line 또는 multi-line)의 라인에서 기관명
 * 텍스트를 markdown 링크로 변환.
 *
 * @returns 변환된 markdown 본문과 치환 횟수
 */
export function fixSourceLinks(markdown: string): {
  result: string;
  replaced: number;
} {
  const domainToUrl = buildDomainToUrl(markdown);
  if (domainToUrl.size === 0) return { result: markdown, replaced: 0 };

  let replaced = 0;
  const bumpReplaced = () => {
    replaced++;
  };
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // (a) 같은 줄 value: "출처: 복지로 · 국토교통부"
    const single = lines[i].match(SOURCE_LINE_RE);
    if (single) {
      const newValue = transformTokens(single[2], domainToUrl, bumpReplaced);
      if (newValue !== single[2]) lines[i] = single[1] + newValue;
      continue;
    }

    // (b) multi-line: 라벨만 있고 값은 다음 줄(들).
    //     "출처:\n  보건복지부 · 정책브리핑" 또는 "- 출처:\n  - 보건복지부\n  - 정책브리핑"
    if (!SOURCE_LABEL_ONLY_RE.test(lines[i])) continue;

    let j = i + 1;
    while (j < lines.length) {
      const line = lines[j];
      // 빈 줄·새 라벨 라인·일반 본문(들여쓰기 없음) 시작 시 종료
      if (!line.trim()) break;
      if (SOURCE_LABEL_ONLY_RE.test(line) || SOURCE_LINE_RE.test(line)) break;
      const valueMatch = line.match(SOURCE_VALUE_LINE_RE);
      if (!valueMatch) break;
      const newValue = transformTokens(valueMatch[2], domainToUrl, bumpReplaced);
      if (newValue !== valueMatch[2]) lines[j] = valueMatch[1] + newValue;
      j++;
    }
    i = j - 1;
  }

  return { result: lines.join("\n"), replaced };
}
