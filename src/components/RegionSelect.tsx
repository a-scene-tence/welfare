"use client";

import { SIDO_LIST } from "@/lib/regions";

const SELECT_CLASS =
  "w-full border-0 border-b border-[color:var(--line)] bg-transparent px-0 py-3 text-base rounded-none focus:outline-none focus:border-[color:var(--ink)] transition-colors disabled:text-[color:var(--muted)]";

type Props = {
  sidoCode: string;
  sigunguCode: string;
  onChange: (
    next:
      | { sidoCode: string; sigunguCode: ""; sido: string; sigungu: "" }
      | {
          sidoCode: string;
          sigunguCode: string;
          sido: string;
          sigungu: string;
        },
  ) => void;
};

export function RegionSelect({ sidoCode, sigunguCode, onChange }: Props) {
  const sido = SIDO_LIST.find((s) => s.code === sidoCode);
  return (
    <div className="space-y-4">
      <p className="eyebrow">Region</p>
      <div className="grid grid-cols-2 gap-6">
        <label className="block">
          <span className="block text-sm font-medium mb-1 text-[color:var(--ink)]">
            시·도
          </span>
          <select
            className={SELECT_CLASS}
            value={sidoCode}
            onChange={(e) => {
              const next = SIDO_LIST.find((s) => s.code === e.target.value);
              onChange({
                sidoCode: e.target.value,
                sigunguCode: "",
                sido: next?.name ?? "",
                sigungu: "",
              });
            }}
          >
            <option value="">선택</option>
            {SIDO_LIST.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1 text-[color:var(--ink)]">
            시·군·구
          </span>
          <select
            className={SELECT_CLASS}
            value={sigunguCode}
            disabled={!sido}
            onChange={(e) => {
              if (!sido) return;
              const g = sido.sigungu.find((x) => x.code === e.target.value);
              onChange({
                sidoCode: sido.code,
                sigunguCode: e.target.value,
                sido: sido.name,
                sigungu: g?.name ?? "",
              });
            }}
          >
            <option value="">선택</option>
            {sido?.sigungu.map((g) => (
              <option key={g.code} value={g.code}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
