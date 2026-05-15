import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export type KbProgram = {
  slug: string;
  name: string;
  ministry?: string;
  category?: string;
  legalBasis?: string;
  legalBasisUrl?: string;
  officialUrl?: string;
  applyUrl?: { online?: string; offline?: string };
  eligibility?: {
    ageMin?: number;
    ageMax?: number;
    incomePercentile?: number;
    households?: string[];
    situations?: string[];
  };
  amountKRW?: { min?: number; max?: number; unit?: "monthly" | "yearly" | "once" };
  year?: number;
  lastVerified?: string;
  staleAfter?: string;
  /** 광역(sigungu null) 또는 기초(sigungu 명시) 자치단체 사업. 미기재 시 중앙. */
  region?: {
    sido?: string;
    sigungu?: string | null;
  };
  body: string;
};

let centralCached: KbProgram[] | null = null;
let regionalCached: KbProgram[] | null = null;
let localCached: KbProgram[] | null = null;

function readMarkdownDir(dir: string, recursive: boolean): KbProgram[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const programs: KbProgram[] = [];
  for (const entry of entries) {
    const path = join(dir, entry);
    let stat;
    try {
      stat = statSync(path);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (recursive) programs.push(...readMarkdownDir(path, true));
      continue;
    }
    if (!entry.endsWith(".md")) continue;
    const raw = readFileSync(path, "utf8");
    const parsed = matter(raw);
    const fm = parsed.data as Omit<KbProgram, "body">;
    programs.push({
      ...fm,
      body: parsed.content.trim(),
      slug: fm.slug ?? entry.replace(/\.md$/, ""),
    });
  }
  return programs;
}

export function loadCentralPrograms(): KbProgram[] {
  if (centralCached) return centralCached;
  centralCached = readMarkdownDir(
    join(process.cwd(), "src", "data", "programs", "central"),
    false,
  );
  return centralCached;
}

export function loadRegionalPrograms(): KbProgram[] {
  if (regionalCached) return regionalCached;
  regionalCached = readMarkdownDir(
    join(process.cwd(), "src", "data", "programs", "regional"),
    true,
  );
  return regionalCached;
}

export function loadLocalPrograms(): KbProgram[] {
  if (localCached) return localCached;
  localCached = readMarkdownDir(
    join(process.cwd(), "src", "data", "programs", "local"),
    true,
  );
  return localCached;
}

export function loadAllPrograms(): KbProgram[] {
  return [
    ...loadCentralPrograms(),
    ...loadRegionalPrograms(),
    ...loadLocalPrograms(),
  ];
}

/**
 * 시스템 프롬프트에 삽입할 형태로 KB 항목을 직렬화.
 */
export function serializeProgram(p: KbProgram): string {
  const headerSuffix = p.region?.sigungu
    ? ` (${p.region.sido}·${p.region.sigungu})`
    : p.region?.sido
      ? ` (${p.region.sido})`
      : p.ministry
        ? ` (${p.ministry})`
        : "";
  const lines: string[] = [`## ${p.name}${headerSuffix}`];
  if (p.ministry && headerSuffix !== ` (${p.ministry})`)
    lines.push(`- 소관: ${p.ministry}`);
  if (p.category) lines.push(`- 분류: ${p.category}`);
  if (p.legalBasis) lines.push(`- 근거: ${p.legalBasis}`);
  if (p.eligibility) {
    const e = p.eligibility;
    const parts: string[] = [];
    if (e.ageMin !== undefined) parts.push(`연령 ${e.ageMin}세 이상`);
    if (e.ageMax !== undefined) parts.push(`${e.ageMax}세 이하`);
    if (e.incomePercentile !== undefined)
      parts.push(`기준 중위소득 ${e.incomePercentile}% 이하`);
    if (e.situations?.length) parts.push(`상황: ${e.situations.join(", ")}`);
    if (parts.length) lines.push(`- 자격: ${parts.join(" · ")}`);
  }
  if (p.amountKRW) {
    const a = p.amountKRW;
    const unit =
      a.unit === "monthly" ? "월" : a.unit === "yearly" ? "연" : "1회";
    lines.push(
      `- 금액: ${unit} ${a.min?.toLocaleString("ko-KR") ?? "?"} ~ ${a.max?.toLocaleString("ko-KR") ?? "?"}원`,
    );
  }
  if (p.officialUrl) lines.push(`- 공식: ${p.officialUrl}`);
  if (p.applyUrl?.online) lines.push(`- 신청(온라인): ${p.applyUrl.online}`);
  if (p.year) lines.push(`- 기준 연도: ${p.year}`);
  if (p.lastVerified) lines.push(`- 최종 검증: ${p.lastVerified}`);
  if (p.body) lines.push(p.body);
  return lines.join("\n");
}
