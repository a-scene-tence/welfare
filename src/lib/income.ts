import medianIncomeData from "@/data/median-income.json";

type MedianIncomeData = {
  year: number;
  monthlyKRW: Record<string, number>;
  perAdditionalMember: number;
};

const data = medianIncomeData as MedianIncomeData;

/**
 * 가구원수별 월 기준 중위소득(원) 반환. 7인 초과 시 1인 추가당 가산.
 */
export function medianIncomeForHousehold(size: number): number {
  if (size <= 0) return 0;
  const direct = data.monthlyKRW[String(size)];
  if (direct) return direct;
  const max = data.monthlyKRW["7"];
  return max + data.perAdditionalMember * (size - 7);
}

/**
 * 가구 월 합산 소득 → 기준 중위소득 대비 백분율(%, 정수 반올림).
 */
export function medianIncomePercentile(
  size: number,
  monthlyKRW: number,
): number {
  const base = medianIncomeForHousehold(size);
  if (base === 0) return 0;
  return Math.round((monthlyKRW / base) * 100);
}

/**
 * 백분율 분위 라벨링 — 사업 자격 기준에서 자주 쓰이는 절단점.
 */
export function incomeBracketLabel(percent: number): string {
  if (percent <= 30) return "기준 중위소득 30% 이하";
  if (percent <= 40) return "기준 중위소득 40% 이하";
  if (percent <= 47) return "기준 중위소득 47% 이하";
  if (percent <= 50) return "기준 중위소득 50% 이하";
  if (percent <= 60) return "기준 중위소득 60% 이하";
  if (percent <= 75) return "기준 중위소득 75% 이하";
  if (percent <= 100) return "기준 중위소득 100% 이하";
  if (percent <= 150) return "기준 중위소득 150% 이하";
  if (percent <= 180) return "기준 중위소득 180% 이하";
  return "기준 중위소득 180% 초과";
}

export const INCOME_DATA_YEAR = data.year;
