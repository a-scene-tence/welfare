"use client";

import type { Marital } from "@/lib/schema";
import { UNDERLINE_INPUT } from "./WelfareForm";

const TOGGLE_BASE =
  "px-5 py-2.5 border text-xs tracking-widest2 uppercase rounded-none transition-colors";
const TOGGLE_ACTIVE =
  "bg-[color:var(--ink)] text-white border-[color:var(--ink)]";
const TOGGLE_IDLE =
  "bg-transparent text-[color:var(--muted)] border-[color:var(--line)] hover:border-[color:var(--ink)] hover:text-[color:var(--ink)]";

type Props = {
  marital: Marital;
  onChange: (m: Marital) => void;
};

export function MaritalSection({ marital, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="eyebrow">Marital</p>
      <span className="block text-sm font-medium text-[color:var(--ink)]">
        결혼 여부
      </span>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className={`${TOGGLE_BASE} ${marital.status === "single" ? TOGGLE_ACTIVE : TOGGLE_IDLE}`}
          onClick={() => onChange({ status: "single" })}
        >
          미혼 / 1인
        </button>
        <button
          type="button"
          className={`${TOGGLE_BASE} ${marital.status === "married" ? TOGGLE_ACTIVE : TOGGLE_IDLE}`}
          onClick={() =>
            onChange({
              status: "married",
              spouseAge: 30,
              spouseAnnualIncomeKRW: 0,
            })
          }
        >
          결혼
        </button>
      </div>
      {marital.status === "married" && (
        <div className="grid grid-cols-2 gap-6 pt-3">
          <label className="block">
            <span className="block text-sm font-medium mb-1 text-[color:var(--ink)]">
              배우자 나이
            </span>
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
              className={UNDERLINE_INPUT}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1 text-[color:var(--ink)]">
              배우자 연 총급여(원)
            </span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={marital.spouseAnnualIncomeKRW || ""}
              onChange={(e) =>
                onChange({
                  ...marital,
                  spouseAnnualIncomeKRW: Number(e.target.value) || 0,
                })
              }
              className={UNDERLINE_INPUT}
              placeholder="예: 36000000"
            />
          </label>
        </div>
      )}
    </div>
  );
}
