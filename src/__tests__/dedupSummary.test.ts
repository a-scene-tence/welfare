import { describe, it, expect } from "vitest";
import { dedupDuplicateSummary } from "@/lib/dedupSummary";

describe("dedupDuplicateSummary", () => {
  it("'1. 자격 요약' 1회 등장 시 변경 없음", () => {
    const md = "1. 자격 요약\n가구원수: 1명\n2. 추천 복지 혜택\n";
    const { result, removed } = dedupDuplicateSummary(md);
    expect(removed).toBe(0);
    expect(result).toBe(md);
  });

  it("§36: '1. 자격 요약' 2회 등장 시 첫 응답 제거", () => {
    const md =
      "1. 자격 요약\n가구원수: 1명\n2. 추천 복지 혜택\n... (turn 0)\n" +
      "본 안내는 공식 출처를 기반으로...\n" +
      "1. 자격 요약\n가구원수: 1명\n2. 추천 복지 혜택\n... (turn 1)\n";
    const { result, removed } = dedupDuplicateSummary(md);
    expect(removed).toBeGreaterThan(0);
    expect(result.startsWith("1. 자격 요약")).toBe(true);
    expect(result).toContain("(turn 1)");
    expect(result).not.toContain("(turn 0)");
  });

  it("§37: 첫 '1. 자격 요약' 이 응답 본문의 첫 글자 (시작 anchor)", () => {
    const md =
      "1. 자격 요약\nturn0 응답\n" +
      "1. 자격 요약\nturn1 응답\n";
    const { result, removed } = dedupDuplicateSummary(md);
    expect(removed).toBeGreaterThan(0);
    expect(result).toContain("turn1");
    expect(result).not.toContain("turn0");
  });

  it("§30: '**1. 자격 요약**' markdown bold 변형 매칭", () => {
    const md =
      "**1. 자격 요약**\nturn0\n\n**1. 자격 요약**\nturn1\n";
    const { removed } = dedupDuplicateSummary(md);
    expect(removed).toBeGreaterThan(0);
  });

  it("'### 1. 자격 요약' H 헤딩 변형 매칭", () => {
    const md = "### 1. 자격 요약\nturn0\n\n### 1. 자격 요약\nturn1\n";
    const { removed } = dedupDuplicateSummary(md);
    expect(removed).toBeGreaterThan(0);
  });
});
