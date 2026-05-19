"use client";

import { SHORT_DISCLAIMER } from "@/lib/prompts/disclaimer";

type Props = {
  disclaimer: boolean;
  storeAnonymizedLog: boolean;
  onChange: (next: { disclaimer: boolean; storeAnonymizedLog: boolean }) => void;
};

export function ConsentBlock({
  disclaimer,
  storeAnonymizedLog,
  onChange,
}: Props) {
  return (
    <div className="space-y-4 border-t border-[color:var(--line)] pt-6">
      <p className="eyebrow">Consent</p>
      <p className="text-sm text-[color:var(--muted)] leading-relaxed">
        {SHORT_DISCLAIMER}
      </p>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={disclaimer}
          onChange={(e) =>
            onChange({ disclaimer: e.target.checked, storeAnonymizedLog })
          }
          className="mt-1 accent-[color:var(--ink)]"
          aria-required
        />
        <span className="text-[color:var(--ink)]">
          <strong>(필수)</strong> 위 안내 사항을 확인했으며, 본 서비스가 정부 공식
          채널이 아니라 참고 정보를 제공한다는 사실에 동의합니다. 자세한 내용은{" "}
          <a href="/terms">이용약관</a>·
          <a href="/privacy">개인정보 처리방침</a>을 확인해 주세요.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={storeAnonymizedLog}
          onChange={(e) =>
            onChange({ disclaimer, storeAnonymizedLog: e.target.checked })
          }
          className="mt-1 accent-[color:var(--ink)]"
        />
        <span className="text-[color:var(--ink)]">
          <strong>(선택)</strong> 서비스 개선을 위해 비식별 처리된 대화 이력을
          30일간 보관하는 데 동의합니다. 소득·결혼·자녀 정보는 버킷화되고 자유
          텍스트의 식별 정보는 자동으로 제거됩니다.
        </span>
      </label>
    </div>
  );
}
