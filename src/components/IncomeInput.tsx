"use client";

import {
  INCOME_DATA_YEAR,
  annualToMonthly,
  incomeBracketLabel,
  medianIncomeForHousehold,
  medianIncomePercentile,
} from "@/lib/income";

type Props = {
  size: number;
  annualIncomeKRW: number;
  spouseAnnualIncomeKRW: number;
  onChangeSize: (v: number) => void;
  onChangeIncome: (v: number) => void;
};

export function IncomeInput({
  size,
  annualIncomeKRW,
  spouseAnnualIncomeKRW,
  onChangeSize,
  onChangeIncome,
}: Props) {
  const annualTotal = annualIncomeKRW + spouseAnnualIncomeKRW;
  const monthlyTotal = annualToMonthly(annualTotal);
  const median = medianIncomeForHousehold(size);
  const pct = medianIncomePercentile(size, monthlyTotal);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="block text-sm font-medium mb-1">가구원수 (본인 포함)</span>
        <input
          type="number"
          min={1}
          max={10}
          value={size || ""}
          onChange={(e) => onChangeSize(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
          placeholder="예: 2"
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-1">본인 연 총급여 (세전, 원)</span>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={annualIncomeKRW || ""}
          onChange={(e) => onChangeIncome(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
          placeholder="예: 36000000"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          연말정산 「총급여액」 또는 근로계약상 연봉(세전, 상여 포함). 자영업자는 연
          사업소득. 한국의 「기준 중위소득」은 월 단위로 고시되므로 월 환산(÷12)하여
          분위를 비교합니다. 청년도약계좌·근로장려금 등 연 단위 사업은 입력값 그대로
          비교합니다.
        </p>
      </label>
      {size > 0 && annualTotal >= 0 && (
        <div className="rounded-md bg-[var(--surface)] border border-[var(--border)] p-3 text-sm text-[var(--muted)] space-y-1">
          <div>
            {INCOME_DATA_YEAR}년 기준 중위소득(가구원 {size}명):{" "}
            <strong>{median.toLocaleString("ko-KR")}원/월</strong>
          </div>
          <div>
            가구합산 연 총급여:{" "}
            <strong>{annualTotal.toLocaleString("ko-KR")}원</strong> · 월 환산{" "}
            <strong>{monthlyTotal.toLocaleString("ko-KR")}원</strong>
          </div>
          <div>
            기준 중위소득 약 <strong>{pct}%</strong> ({incomeBracketLabel(pct)})
          </div>
        </div>
      )}
    </div>
  );
}
