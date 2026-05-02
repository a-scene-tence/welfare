import { readdirSync, readFileSync } from "node:fs";
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
  body: string;
};

let cached: KbProgram[] | null = null;

export function loadCentralPrograms(): KbProgram[] {
  if (cached) return cached;
  const dir = join(process.cwd(), "src", "data", "programs", "central");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    cached = [];
    return cached;
  }
  cached = files.map((file) => {
    const raw = readFileSync(join(dir, file), "utf8");
    const parsed = matter(raw);
    const fm = parsed.data as Omit<KbProgram, "body">;
    return { ...fm, body: parsed.content.trim(), slug: fm.slug ?? file.replace(/\.md$/, "") };
  });
  return cached;
}

/**
 * 시스템 프롬프트에 삽입할 형태로 KB 항목을 직렬화.
 */
export function serializeProgram(p: KbProgram): string {
  const lines: string[] = [`## ${p.name}${p.ministry ? ` (${p.ministry})` : ""}`];
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
