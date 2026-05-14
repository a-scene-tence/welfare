import { describe, it, expect } from "vitest";
import { fixSourceLinks } from "@/lib/sourceLinkFix";

describe("fixSourceLinks", () => {
  it("본문에 도메인 URL 존재 시 그 URL 로 markdown 링크 변환", () => {
    const md =
      "버팀목 대출 안내\nhttps://nhuf.molit.go.kr\n출처: 국토교통부 · 주택도시기금";
    const { result, replaced } = fixSourceLinks(md);
    expect(replaced).toBeGreaterThan(0);
    expect(result).toMatch(/\[국토교통부\]\([^)]+\)/);
  });

  it("§27 B: fallback URL — 본문에 도메인 URL 없어도 변환", () => {
    const md = "기초연금 안내\n출처: 국토교통부";
    const { result, replaced } = fixSourceLinks(md);
    expect(replaced).toBeGreaterThan(0);
    expect(result).toContain("[국토교통부](https://www.molit.go.kr/)");
  });

  it("§30: '**출처:**' (콜론이 ** 안쪽) 변형 매칭", () => {
    const md = "**출처:** 국토교통부";
    const { replaced } = fixSourceLinks(md);
    expect(replaced).toBeGreaterThan(0);
  });

  it("§30: '**출처**:' (콜론이 ** 밖) 변형 매칭", () => {
    const md = "**출처**: 국토교통부";
    const { replaced } = fixSourceLinks(md);
    expect(replaced).toBeGreaterThan(0);
  });

  it("§30: '출처: **국토교통부**' (값이 bold) 매칭 후 변환", () => {
    const md = "출처: **국토교통부**";
    const { result, replaced } = fixSourceLinks(md);
    expect(replaced).toBeGreaterThan(0);
    expect(result).toContain("[국토교통부](https://www.molit.go.kr/)");
  });

  it("이미 markdown 링크 형식이면 skip", () => {
    const md = "출처: [국토교통부](https://www.molit.go.kr/USR/policyData/1)";
    const { result, replaced } = fixSourceLinks(md);
    expect(replaced).toBe(0);
    expect(result).toBe(md);
  });

  it("서울특별시 fallback URL", () => {
    const md = "출처: 서울특별시";
    const { result } = fixSourceLinks(md);
    expect(result).toContain("[서울특별시](https://www.seoul.go.kr/)");
  });

  it("부산 동래구 fallback URL", () => {
    const md = "출처: 동래구청";
    const { result } = fixSourceLinks(md);
    expect(result).toContain("[동래구청](https://www.dongnae.go.kr/)");
  });

  it("광주광역시 동구 fallback URL", () => {
    const md = "출처: 광주광역시 동구";
    const { result } = fixSourceLinks(md);
    expect(result).toContain("[광주광역시 동구](https://www.donggu.gwangju.kr/)");
  });

  it("multi-line 출처 라인 처리", () => {
    const md = "출처:\n  복지로\n  국토교통부\n";
    const { replaced } = fixSourceLinks(md);
    expect(replaced).toBeGreaterThan(0);
  });
});
