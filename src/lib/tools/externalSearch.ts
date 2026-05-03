/**
 * 외부 웹 검색 어댑터 — Anthropic 외 공급자(Upstage 등)에서 사용.
 * Tavily API 우선(무료 1000회/월), 키 미설정 시 명시적 안내 메시지 반환.
 * 도메인 화이트리스트는 호출 측에서 전달.
 */

export type SearchHit = {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
};

export type SearchResult = {
  query: string;
  hits: SearchHit[];
  /** 검색 실패·키 미설정 등 사유. 성공 시 비어 있음. */
  notice?: string;
};

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

export async function externalSearch(
  query: string,
  allowedDomains: string[],
  opts?: { maxResults?: number; signal?: AbortSignal },
): Promise<SearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      query,
      hits: [],
      notice:
        "웹 검색이 비활성화 상태입니다(TAVILY_API_KEY 미설정). 시드 KB 정보만으로 답변하며, 최신성 확인은 보건복지상담센터(129) 안내를 권장합니다.",
    };
  }

  const body = {
    api_key: apiKey,
    query,
    search_depth: "basic" as const,
    max_results: opts?.maxResults ?? 5,
    ...(allowedDomains.length ? { include_domains: allowedDomains } : {}),
  };

  let res: Response;
  try {
    res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: opts?.signal,
    });
  } catch (err) {
    return {
      query,
      hits: [],
      notice: `웹 검색 네트워크 오류: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!res.ok) {
    return {
      query,
      hits: [],
      notice: `웹 검색 실패 (HTTP ${res.status}). 시드 KB만으로 답변합니다.`,
    };
  }

  const data = (await res.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string; published_date?: string }>;
  };
  const hits: SearchHit[] = (data.results ?? [])
    .filter((r) => r.url && isAllowed(r.url, allowedDomains))
    .map((r) => ({
      title: r.title ?? "(제목 없음)",
      url: r.url!,
      content: (r.content ?? "").slice(0, 1200),
      publishedDate: r.published_date,
    }));

  return { query, hits };
}

/** 화이트리스트 필터 — Tavily의 include_domains는 부분 매칭이라 추가 검증. */
function isAllowed(url: string, allowedDomains: string[]): boolean {
  if (!allowedDomains.length) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return allowedDomains.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/** 검색 결과를 LLM이 소비하기 좋은 마크다운 텍스트로 직렬화. */
export function formatSearchResultForLlm(result: SearchResult): string {
  if (result.notice && result.hits.length === 0) {
    return `[검색 알림] ${result.notice}`;
  }
  if (result.hits.length === 0) {
    return `[검색 결과 없음] "${result.query}" — 공식 출처에서 일치 결과를 찾지 못했습니다.`;
  }
  const header = `[검색 결과: "${result.query}"] 총 ${result.hits.length}건`;
  const lines = result.hits.map((h, i) => {
    const date = h.publishedDate ? ` (게시일: ${h.publishedDate})` : "";
    return `${i + 1}. ${h.title} — ${h.url}${date}\n${h.content}`;
  });
  return [header, ...lines].join("\n\n");
}
