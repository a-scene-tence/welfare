"use client";

import { useState } from "react";
import { UNDERLINE_INPUT } from "./WelfareForm";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function ApiKeyInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3 border-t border-[color:var(--line)] pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs uppercase tracking-widest2 text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors"
      >
        {open
          ? "Hide BYOK · API 키 입력 숨기기"
          : "BYOK · 본인 Anthropic API 키 사용"}
      </button>
      {open && (
        <div>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={UNDERLINE_INPUT}
            autoComplete="off"
          />
          <p className="text-xs text-[color:var(--muted)] mt-2 leading-relaxed">
            키는 서버에 저장되지 않으며, 이번 대화 1회만 호출에 사용됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
