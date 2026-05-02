import { SHORT_DISCLAIMER } from "@/lib/prompts/disclaimer";

export function DisclaimerFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)] space-y-1">
      <p>{SHORT_DISCLAIMER}</p>
      <p>
        문의/보다 정확한 안내: 보건복지상담센터 <strong>129</strong> · 거주지 행정복지센터
      </p>
      <p className="space-x-2">
        <a href="/about">서비스 소개</a>
        <span aria-hidden>·</span>
        <a href="/privacy">개인정보 처리방침</a>
        <span aria-hidden>·</span>
        <a href="/terms">이용약관</a>
      </p>
    </footer>
  );
}
