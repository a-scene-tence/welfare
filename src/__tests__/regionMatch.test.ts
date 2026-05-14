import { describe, it, expect } from "vitest";
import {
  extractTierBlock,
  tierBlockIsEmpty,
  matchSidoInUrl,
  matchSigunguInUrl,
  extractUrls,
} from "@/lib/regionMatch";

describe("extractTierBlock", () => {
  it("②: ③ 마커가 종료 마커 (정상 추출)", () => {
    const md =
      "② 서울특별시 사업\n서울 신혼부부 임차보증금 이자지원\n출처: 서울특별시\n" +
      "③ 노원구 사업\n노원구 청년 자립지원\n";
    const block = extractTierBlock(md, 2)!;
    expect(block).toContain("② 서울특별시 사업");
    expect(block).toContain("서울 신혼부부 임차보증금 이자지원");
    expect(block).not.toContain("③ 노원구");
  });

  it("§32: ② 블록 안의 ## H2 헤딩이 종료 마커가 아님", () => {
    const md =
      "② 서울특별시 사업\n## 서울 신혼부부 임차보증금 이자지원\n출처: https://housing.seoul.go.kr\n" +
      "③ 노원구 사업\n";
    const block = extractTierBlock(md, 2)!;
    expect(block.length).toBeGreaterThan(30);
    expect(block).toContain("서울 신혼부부");
    expect(block).toContain("housing.seoul.go.kr");
  });

  it("§33: ② 블록 안의 '1. 사업명' ordered list 가 종료 마커가 아님 (다음 단계만)", () => {
    const md =
      "② 부산광역시 사업\n1. 부산 노인 맞춤돌봄\n2. 부산 노인일자리\n출처: 부산광역시\n" +
      "③ 동래구 사업\n1. 동래구 어르신 일자리\n";
    const block = extractTierBlock(md, 2)!;
    expect(block).toContain("1. 부산 노인");
    expect(block).toContain("2. 부산 노인일자리");
  });

  it("§34: ③ 블록 끝에 '3. 다음 단계' 평문 헤딩 매치", () => {
    const md =
      "③ 동래구 사업\n동래구 어르신 일자리·여가\n출처: 동래구청\n" +
      "3. 다음 단계\n우선순위 신청 권고:\n기초연금 ...";
    const block = extractTierBlock(md, 3)!;
    expect(block).toContain("동래구 어르신");
    expect(block).not.toContain("다음 단계");
    expect(block).not.toContain("기초연금");
  });

  it("§39: ③ 블록 끝에 '### 3. 다음 단계' H 헤딩 매치", () => {
    const md =
      "③ 동래구 사업\n동래구 어르신 일자리·여가\n출처: 동래구청\n" +
      "### 3. 다음 단계\n우선순위 신청 권고:\n기초연금 ...";
    const block = extractTierBlock(md, 3)!;
    expect(block).toContain("동래구 어르신");
    expect(block).not.toContain("다음 단계");
    expect(block).not.toContain("기초연금");
  });

  it("'3. 다음 단계' 가 ② 블록 ~ ③ 블록 사이가 아닐 때만 종료 (응답 본문 안의 평범한 1./2./3. 무시)", () => {
    const md = "② 서울특별시 사업\n1. 사업A\n2. 사업B\n3. 사업C\n출처: ...\n③ 다음...";
    const block = extractTierBlock(md, 2)!;
    expect(block).toContain("3. 사업C");
  });

  it("tier=3 + ④ 마커 종료", () => {
    const md = "③ 동래구 사업\n동래구 어르신 일자리\n④ 추가 정보\n";
    const block = extractTierBlock(md, 3)!;
    expect(block).toContain("동래구 어르신");
    expect(block).not.toContain("추가 정보");
  });

  it("마커 없으면 null", () => {
    expect(extractTierBlock("① 중앙정부 사업\n버팀목 ...", 2)).toBeNull();
  });
});

describe("tierBlockIsEmpty", () => {
  it("'확인된 사업 없음' 패턴 매치", () => {
    expect(tierBlockIsEmpty("② 서울: 확인된 사업 없음")).toBe(true);
    expect(tierBlockIsEmpty("③ 노원구: 확인된 사업 없음 — 거주지 문의 권장")).toBe(true);
  });

  it("실제 사업 블록은 false", () => {
    expect(tierBlockIsEmpty("② 서울 사업\n신혼부부 임차 ...")).toBe(false);
  });
});

describe("matchSidoInUrl / matchSigunguInUrl", () => {
  it("서울 로마자 매치", () => {
    expect(matchSidoInUrl("서울특별시", "https://www.seoul.go.kr/")).toBe(true);
    expect(matchSidoInUrl("서울특별시", "https://housing.seoul.go.kr/")).toBe(true);
  });

  it("부산 로마자 매치", () => {
    expect(matchSidoInUrl("부산광역시", "https://www.busan.go.kr/")).toBe(true);
  });

  it("다른 시·도는 false", () => {
    expect(matchSidoInUrl("서울특별시", "https://www.busan.go.kr/")).toBe(false);
  });

  it("노원구 한글·로마자 매치", () => {
    expect(matchSigunguInUrl("노원구", "https://www.nowon.kr/")).toBe(true);
  });

  it("동래구 한글 매치", () => {
    expect(matchSigunguInUrl("동래구", "https://www.dongnae.go.kr/")).toBe(true);
  });
});

describe("extractUrls", () => {
  it("markdown 링크에서 URL 추출", () => {
    const text = "[서울특별시](https://www.seoul.go.kr/) 및 [복지로](https://www.bokjiro.go.kr/)";
    const urls = extractUrls(text);
    expect(urls).toContain("https://www.seoul.go.kr/");
    expect(urls).toContain("https://www.bokjiro.go.kr/");
  });

  it("bare URL 추출 + 중복 제거", () => {
    const text = "https://www.seoul.go.kr/ 등 https://www.seoul.go.kr/";
    const urls = extractUrls(text);
    expect(urls).toEqual(["https://www.seoul.go.kr/"]);
  });
});
