"use client";

import { SITUATION_LABELS, type Situation } from "@/lib/schema";

type Props = {
  values: Situation[];
  onChange: (next: Situation[]) => void;
};

const ORDER: Situation[] = [
  "disability",
  "single_parent",
  "multicultural",
  "veteran",
  "north_korean_defector",
  "unemployed",
  "startup",
  "farmer",
  "pregnant",
  "caregiver",
  "student",
  "homeless",
];

const CHIP_BASE =
  "px-4 py-2 border text-sm rounded-none transition-colors";
const CHIP_ACTIVE =
  "bg-[color:var(--ink)] text-white border-[color:var(--ink)]";
const CHIP_IDLE =
  "bg-transparent text-[color:var(--ink)] border-[color:var(--line)] hover:border-[color:var(--ink)]";

export function SituationsCheckbox({ values, onChange }: Props) {
  const toggle = (s: Situation) => {
    const has = values.includes(s);
    const next = has
      ? values.filter((v) => v !== s)
      : [...values.filter((v) => v !== "none"), s];
    onChange(next.length === 0 ? ["none"] : next);
  };
  return (
    <div className="space-y-3">
      <p className="eyebrow">Situations</p>
      <span className="block text-sm font-medium text-[color:var(--ink)]">
        해당하는 상황 (복수 선택)
      </span>
      <div className="flex flex-wrap gap-2 pt-1">
        {ORDER.map((s) => {
          const active = values.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`${CHIP_BASE} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {SITUATION_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
