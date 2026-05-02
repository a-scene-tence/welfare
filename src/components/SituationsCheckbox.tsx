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

export function SituationsCheckbox({ values, onChange }: Props) {
  const toggle = (s: Situation) => {
    const has = values.includes(s);
    const next = has ? values.filter((v) => v !== s) : [...values.filter((v) => v !== "none"), s];
    onChange(next.length === 0 ? ["none"] : next);
  };
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">해당하는 상황 (복수 선택)</span>
      <div className="flex flex-wrap gap-2">
        {ORDER.map((s) => {
          const active = values.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`px-3 py-1.5 rounded-full border text-sm ${active ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "bg-white border-[var(--border)]"}`}
            >
              {SITUATION_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
