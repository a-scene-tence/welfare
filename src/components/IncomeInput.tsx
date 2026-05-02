"use client";

import {
  INCOME_DATA_YEAR,
  incomeBracketLabel,
  medianIncomeForHousehold,
  medianIncomePercentile,
} from "@/lib/income";

type Props = {
  size: number;
  monthlyIncomeKRW: number;
  spouseMonthlyIncomeKRW: number;
  onChangeSize: (v: number) => void;
  onChangeIncome: (v: number) => void;
};

export function IncomeInput({
  size,
  monthlyIncomeKRW,
  spouseMonthlyIncomeKRW,
  onChangeSize,
  onChangeIncome,
}: Props) {
  const total = monthlyIncomeKRW + spouseMonthlyIncomeKRW;
  const median = medianIncomeForHousehold(size);
  const pct = medianIncomePercentile(size, total);

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
        <span className="block text-sm font-medium mb-1">본인 월 소득 (세전, 원)</span>
        <input
          type="number"
          min={0}
          step={10000}
          value={monthlyIncomeKRW || ""}
          onChange={(e) => onChangeIncome(Number(e.target.value) || 0)}
          className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
          placeholder="예: 3000000"
        />
      </label>
      {size > 0 && total >= 0 && (
        <div className="rounded-md bg-[var(--surface)] border border-[var(--border)] p-3 text-sm text-[var(--muted)]">
          <div>
            {INCOME_DATA_YEAR}년 기준 중위소득(가구원 {size}명):{" "}
            <strong>{median.toLocaleString("ko-KR")}원/월</strong>
          </div>
          <div>
            가구합산 소득: <strong>{total.toLocaleString("ko-KR")}원</strong> · 중위소득 약{" "}
            <strong>{pct}%</strong> ({incomeBracketLabel(pct)})
          </div>
        </div>
      )}
    </div>
  );
}
