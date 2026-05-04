"use client";

import type { Marital } from "@/lib/schema";

type Props = {
  marital: Marital;
  onChange: (m: Marital) => void;
};

export function MaritalSection({ marital, onChange }: Props) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">결혼 여부</span>
      <div className="flex gap-2">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md border text-sm ${marital.status === "single" ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "bg-white border-[var(--border)]"}`}
          onClick={() => onChange({ status: "single" })}
        >
          미혼 / 1인 가구
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-md border text-sm ${marital.status === "married" ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "bg-white border-[var(--border)]"}`}
          onClick={() =>
            onChange({
              status: "married",
              spouseAge: 30,
              spouseMonthlyIncomeKRW: 0,
            })
          }
        >
          결혼
        </button>
      </div>
      {marital.status === "married" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-sm font-medium mb-1">배우자 나이</span>
            <input
              type="number"
              min={0}
              max={120}
              value={marital.spouseAge || ""}
              onChange={(e) =>
                onChange({
                  ...marital,
                  spouseAge: Number(e.target.value) || 0,
                })
              }
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">배우자 월 소득(원)</span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={marital.spouseMonthlyIncomeKRW || ""}
              onChange={(e) =>
                onChange({
                  ...marital,
                  spouseMonthlyIncomeKRW: Number(e.target.value) || 0,
                })
              }
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
            />
          </label>
        </div>
      )}
    </div>
  );
}
