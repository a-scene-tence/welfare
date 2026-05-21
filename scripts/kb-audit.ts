#!/usr/bin/env node
/**
 * KB staleAfter audit.
 *
 * - exit 1 if any KB is expired (staleAfter < today) → CI gate fails, PR blocked.
 * - exit 0 with warnings if staleAfter within 30d.
 * - Output is GitHub Actions Step Summary compatible markdown.
 */
import { loadAllPrograms } from "../src/lib/kb/loader";

const WARN_DAYS = 30;
const now = Date.now();

type Row = { slug: string; staleAfter: string; days: number };
const expired: Row[] = [];
const warning: Row[] = [];
const missing: Array<{ slug: string; reason: string }> = [];

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  return null;
}

const programs = loadAllPrograms();
for (const p of programs) {
  const staleAfter = toIsoDate(p.staleAfter);
  if (!staleAfter) {
    missing.push({ slug: p.slug, reason: "staleAfter 필드 누락" });
    continue;
  }
  const stale = new Date(staleAfter).getTime();
  if (Number.isNaN(stale)) {
    missing.push({
      slug: p.slug,
      reason: `staleAfter 파싱 실패: ${staleAfter}`,
    });
    continue;
  }
  const diffDays = Math.floor((stale - now) / 86_400_000);
  if (diffDays < 0) {
    expired.push({ slug: p.slug, staleAfter, days: -diffDays });
  } else if (diffDays <= WARN_DAYS) {
    warning.push({ slug: p.slug, staleAfter, days: diffDays });
  }
}

const today = new Date().toISOString().slice(0, 10);
const lines: string[] = [];
lines.push(`# KB Audit Report (${today})`);
lines.push("");
lines.push(`- Total KB: **${programs.length}**`);
lines.push(`- Expired: **${expired.length}**`);
lines.push(`- Warning (≤${WARN_DAYS}d): **${warning.length}**`);
lines.push(`- Missing fields: **${missing.length}**`);
lines.push("");

if (expired.length) {
  lines.push("## ❌ Expired");
  for (const e of expired) {
    lines.push(`- \`${e.slug}\` — ${e.staleAfter} (${e.days}일 경과)`);
  }
  lines.push("");
}
if (warning.length) {
  lines.push("## ⚠ Warning (갱신 권장)");
  for (const w of warning) {
    lines.push(`- \`${w.slug}\` — ${w.staleAfter} (${w.days}일 남음)`);
  }
  lines.push("");
}
if (missing.length) {
  lines.push("## ⚠ Missing fields");
  for (const m of missing) {
    lines.push(`- \`${m.slug}\` — ${m.reason}`);
  }
  lines.push("");
}
if (!expired.length && !warning.length && !missing.length) {
  lines.push("✅ 모든 KB 가 신선합니다.");
  lines.push("");
}

console.log(lines.join("\n"));

if (expired.length > 0) {
  process.exit(1);
}
