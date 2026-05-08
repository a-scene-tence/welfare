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

const AGENCY_DOMAIN_MAP: Array<{ name: string; domains: string[] }> = [
  // 통합 복지 정보
  { name: "국가법령정보센터", domains: ["law.go.kr"] },
  { name: "공공데이터포털", domains: ["data.go.kr"] },
  { name: "정책브리핑", domains: ["korea.kr"] },
  { name: "복지로", domains: ["bokjiro.go.kr"] },
  { name: "정부24", domains: ["gov.kr"] },

  // 중앙부처
  { name: "보건복지부", domains: ["mohw.go.kr"] },
  { name: "고용노동부", domains: ["moel.go.kr"] },
  { name: "국토교통부", domains: ["molit.go.kr"] },
  { name: "여성가족부", domains: ["mogef.go.kr"] },
  { name: "농림축산식품부", domains: ["mafra.go.kr"] },
  { name: "중소벤처기업부", domains: ["mss.go.kr"] },
  { name: "교육부", domains: ["moe.go.kr"] },
  { name: "행정안전부", domains: ["mois.go.kr"] },
  { name: "금융위원회", domains: ["fsc.go.kr"] },
  { name: "국세청", domains: ["nts.go.kr", "hometax.go.kr"] },

  // 사업별 공식 사이트
  { name: "기초연금 공식 사이트", domains: ["basicpension.mohw.go.kr"] },
  { name: "주택도시기금 포털", domains: ["nhuf.molit.go.kr"] },
  { name: "주택도시기금", domains: ["nhuf.molit.go.kr"] },
  { name: "마이홈포털", domains: ["myhome.go.kr"] },
  { name: "마이홈", domains: ["myhome.go.kr"] },
  { name: "워크넷", domains: ["work24.go.kr", "work.go.kr"] },
  { name: "온라인청년센터", domains: ["youthcenter.go.kr"] },
  { name: "청년몽땅정보통", domains: ["youth.seoul.go.kr"] },
  { name: "국민건강보험공단", domains: ["nhis.or.kr"] },
  { name: "국민건강보험", domains: ["nhis.or.kr"] },
  { name: "국민연금공단", domains: ["nps.or.kr"] },
  { name: "한국노인인력개발원", domains: ["kordi.or.kr"] },
  { name: "한국주택금융공사", domains: ["hf.go.kr"] },
  { name: "한국토지주택공사", domains: ["lh.or.kr"] },
  { name: "LH", domains: ["lh.or.kr"] },
  { name: "홈택스", domains: ["hometax.go.kr"] },
  { name: "국민취업지원제도", domains: ["work24.go.kr", "work.go.kr", "kua.go.kr"] },
  { name: "기초연금", domains: ["basicpension.mohw.go.kr"] },

  // 광역시도
  { name: "서울특별시", domains: ["seoul.go.kr"] },
  { name: "서울주거포털", domains: ["housing.seoul.go.kr"] },
  { name: "부산광역시", domains: ["busan.go.kr"] },
  { name: "대구광역시", domains: ["daegu.go.kr"] },
  { name: "인천광역시", domains: ["incheon.go.kr"] },
  { name: "광주광역시청", domains: ["gwangju.go.kr"] },
  { name: "광주광역시", domains: ["gwangju.go.kr"] },
  { name: "대전광역시", domains: ["daejeon.go.kr"] },
  { name: "울산광역시", domains: ["ulsan.go.kr"] },
  { name: "세종특별자치시", domains: ["sejong.go.kr"] },
  { name: "경기도", domains: ["gg.go.kr"] },
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

// 「출처」 또는 「신청 경로」 라벨 행 매칭. 라벨은 `**` 강조나 `-`/`*` 불릿이 앞에 붙을 수 있음.
const SOURCE_LINE_RE =
  /^(\s*[-*]?\s*(?:\*\*)?(?:출처|신청\s*경로)(?:\*\*)?\s*[:：]\s*)(.+)$/;

/**
 * 「출처: 복지로 · 국토교통부」 패턴의 행에서 기관명 텍스트를 markdown 링크로 변환.
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
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(SOURCE_LINE_RE);
    if (!m) continue;
    const prefix = m[1];
    const value = m[2];

    // 토큰 분할: ` · ` 또는 ` / ` 구분자. 토큰 내부 텍스트는 그대로 보존하면서
    // 매칭되는 기관명만 markdown 링크로 치환.
    const transformedValue = value.replace(/([^·/\n]+)/g, (token) => {
      const trimmed = token.trim();
      if (!trimmed) return token;
      // 이미 markdown 링크 또는 URL 단독이면 그대로
      if (token.includes("](") || /^https?:\/\//i.test(trimmed)) return token;

      for (const { name, domains } of SORTED_AGENCY_MAP) {
        if (!token.includes(name)) continue;
        for (const domain of domains) {
          const url = findUrlForDomain(domainToUrl, domain);
          if (!url) continue;
          replaced++;
          return token.replace(name, `[${name}](${url})`);
        }
      }
      return token;
    });

    if (transformedValue !== value) {
      lines[i] = prefix + transformedValue;
    }
  }

  return { result: lines.join("\n"), replaced };
}
