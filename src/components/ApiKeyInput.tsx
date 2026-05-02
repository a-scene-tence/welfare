"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function ApiKeyInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm underline text-[var(--muted)]"
      >
        {open ? "본인 API 키 입력 숨기기" : "본인 Anthropic API 키 사용 (사용량 한도 면제)"}
      </button>
      {open && (
        <div>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
            autoComplete="off"
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            키는 서버에 저장되지 않으며, 이번 대화 1회만 호출에 사용됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
