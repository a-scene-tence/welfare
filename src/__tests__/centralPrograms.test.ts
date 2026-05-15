import { describe, it, expect } from "vitest";
import { findCentralProgramsInBlock } from "@/lib/centralPrograms";

describe("findCentralProgramsInBlock", () => {
  it("단순 중앙 사업명 키워드 매칭", () => {
    const block =
      "③ 동래구 사업\n동래구 노인지원\n혜택: 기초연금 연계\n";
    const found = findCentralProgramsInBlock(block);
    expect(found).toContain("기초연금");
  });

  it("§35: 사업명 라인 '(광역 가산)' 부속 표기 시 키워드 매칭 제외", () => {
    const block =
      "② 부산광역시 사업\n부산 노인일자리 (광역 가산) (부산광역시)\n혜택: 일자리 활동비\n출처: 부산광역시\n";
    const found = findCentralProgramsInBlock(block);
    expect(found).not.toContain("노인일자리");
  });

  it("§38: 가산 사업의 후속 '혜택:' 라인도 함께 skip (사업 블록 단위)", () => {
    const block =
      "② 부산광역시 사업\n" +
      "부산 노인 맞춤돌봄 (광역 가산) (부산광역시)\n" +
      "혜택: 중앙정부 노인맞춤돌봄서비스 확대 운영\n" +
      "출처: 부산광역시\n";
    const found = findCentralProgramsInBlock(block);
    expect(found).not.toContain("노인맞춤돌봄");
  });

  it("§38: 다음 사업명 라인에서 skip 종료", () => {
    const block =
      "③ 동래구 사업\n" +
      "1. 동래구 어르신 일자리·여가 (광역 가산)\n" +
      "혜택: 중앙정부 노인일자리 사업에 가산\n" +
      "2. 다른 사업 (가산 없음)\n" +
      "혜택: 기초연금 안내\n";
    const found = findCentralProgramsInBlock(block);
    expect(found).not.toContain("노인일자리"); // 가산 라인의 혜택 제외
    expect(found).toContain("기초연금"); // 가산 없는 사업의 혜택 포함
  });

  it("(구 가산) 부속 표기도 인식", () => {
    const block =
      "③ 동래구 사업\n" +
      "동래구 어르신 일자리 (구 가산) (동래구)\n" +
      "혜택: 노인일자리 활동비\n";
    const found = findCentralProgramsInBlock(block);
    expect(found).not.toContain("노인일자리");
  });

  it("화이트리스트 키워드 모두 인식", () => {
    const block = "③ 일반 사업\n버팀목 안내\n청년도약계좌 안내\n근로장려금 안내\n";
    const found = findCentralProgramsInBlock(block);
    expect(found).toEqual(expect.arrayContaining(["버팀목", "청년도약계좌", "근로장려금"]));
  });
});
