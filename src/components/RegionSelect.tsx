"use client";

import { SIDO_LIST } from "@/lib/regions";

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
    <div className="grid grid-cols-2 gap-2">
      <label className="block">
        <span className="block text-sm font-medium mb-1">시·도</span>
        <select
          className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
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
        <span className="block text-sm font-medium mb-1">시·군·구</span>
        <select
          className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base disabled:bg-gray-50"
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
  );
}
