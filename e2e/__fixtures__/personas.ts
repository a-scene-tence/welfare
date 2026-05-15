/**
 * 회귀 테스트 페르소나 정의 — §24~§39 회귀 진단 사이클에서 사용된 P1·P2·P3.
 */

export type Persona = {
  name: string;
  profile: {
    region: { sido: string; sigungu: string; sidoCode: string; sigunguCode: string };
    age: number;
    household: { size: number; annualIncomeKRW: number };
    marital:
      | { status: "single" }
      | { status: "married"; spouseAge: number; spouseAnnualIncomeKRW: number };
    children: { age: number }[];
    situations: ("none" | string)[];
    freeText?: string;
    consent: { disclaimer: true; storeAnonymizedLog: boolean };
  };
};

export const PERSONAS: Persona[] = [
  {
    name: "P1 노원구 32세 신혼부부",
    profile: {
      region: { sido: "서울특별시", sigungu: "노원구", sidoCode: "11", sigunguCode: "11350" },
      age: 32,
      household: { size: 2, annualIncomeKRW: 36_000_000 },
      marital: { status: "married", spouseAge: 30, spouseAnnualIncomeKRW: 0 },
      children: [],
      situations: ["none"],
      freeText: "",
      consent: { disclaimer: true, storeAnonymizedLog: false },
    },
  },
  {
    name: "P2 동래구 65세 1인 가구",
    profile: {
      region: { sido: "부산광역시", sigungu: "동래구", sidoCode: "26", sigunguCode: "26260" },
      age: 65,
      household: { size: 1, annualIncomeKRW: 18_000_000 },
      marital: { status: "single" },
      children: [],
      situations: ["none"],
      freeText: "",
      consent: { disclaimer: true, storeAnonymizedLog: false },
    },
  },
  {
    name: "P3 광주 동구 29세 청년",
    profile: {
      region: { sido: "광주광역시", sigungu: "동구", sidoCode: "29", sigunguCode: "29110" },
      age: 29,
      household: { size: 1, annualIncomeKRW: 26_400_000 },
      marital: { status: "single" },
      children: [],
      situations: ["none"],
      freeText: "",
      consent: { disclaimer: true, storeAnonymizedLog: false },
    },
  },
];
