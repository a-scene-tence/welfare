import { describe, it, expect } from "vitest";
import { stripUserSourcesSection } from "@/lib/stripSourcesSection";

describe("stripUserSourcesSection", () => {
  it("평문 '참고한 공식 출처' 헤더 + 후속 라인 제거", () => {
    const md =
      "본문 응답...\n참고한 공식 출처\n국토교통부\n복지로\n서울특별시\n";
    const { result, removed } = stripUserSourcesSection(md);
    expect(removed).toBe(true);
    expect(result).not.toContain("참고한 공식 출처");
    expect(result).not.toContain("국토교통부");
  });

  it("'참고한 공식 출처:' 콜론 변형 처리", () => {
    const md = "본문...\n참고한 공식 출처:\n국토교통부\n";
    const { removed } = stripUserSourcesSection(md);
    expect(removed).toBe(true);
  });

  it("§30: '**참고한 공식 출처**:' markdown bold 변형 매칭", () => {
    const md = "본문...\n**참고한 공식 출처**:\n국토교통부\n";
    const { removed } = stripUserSourcesSection(md);
    expect(removed).toBe(true);
  });

  it("§30: '**참고한 공식 출처:**' (콜론이 ** 안쪽) 매칭", () => {
    const md = "본문...\n**참고한 공식 출처:**\n국토교통부\n";
    const { removed } = stripUserSourcesSection(md);
    expect(removed).toBe(true);
  });

  it("면책 박스(>) 만나면 cut 중단 — 면책 박스는 유지", () => {
    const md =
      "본문...\n참고한 공식 출처\n국토교통부\n\n> 본 안내는 공식 출처를 ...\n";
    const { result, removed } = stripUserSourcesSection(md);
    expect(removed).toBe(true);
    expect(result).toContain("> 본 안내는");
  });

  it("⚠ 자동 검증 경고 만나면 cut 중단 — 경고 유지", () => {
    const md =
      "참고한 공식 출처\n국토교통부\n\n⚠ 자동 검증 경고: ...\n";
    const { result, removed } = stripUserSourcesSection(md);
    expect(removed).toBe(true);
    expect(result).toContain("⚠ 자동 검증 경고");
  });

  it("--- 구분선 만나면 cut 중단", () => {
    const md = "참고한 공식 출처\n국토교통부\n---\n다음 섹션\n";
    const { result, removed } = stripUserSourcesSection(md);
    expect(removed).toBe(true);
    expect(result).toContain("---");
  });

  it("응답에 헤더 없으면 변경 없음", () => {
    const md = "단순 응답 본문";
    const { result, removed } = stripUserSourcesSection(md);
    expect(removed).toBe(false);
    expect(result).toBe(md);
  });

  it("'Sources' 영문 헤더도 매칭", () => {
    const md = "본문\nSources\nhttps://example.com\n";
    const { removed } = stripUserSourcesSection(md);
    expect(removed).toBe(true);
  });
});
