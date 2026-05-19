import { SHORT_DISCLAIMER } from "@/lib/prompts/disclaimer";

const currentYear = new Date().getFullYear();

export function DisclaimerFooter() {
  return (
    <footer className="mt-20 border-t border-[color:var(--line)] pt-8 pb-12 text-xs text-[color:var(--muted)] space-y-3">
      <p className="eyebrow">Disclaimer</p>
      <p className="leading-relaxed">{SHORT_DISCLAIMER}</p>
      <p>
        문의 · 정확한 안내: 보건복지상담센터{" "}
        <strong className="text-[color:var(--ink)]">129</strong> · 거주지 행정복지센터
      </p>
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        <a href="/about">서비스 소개</a>
        <a href="/privacy">개인정보 처리방침</a>
        <a href="/terms">이용약관</a>
      </p>
      <p className="eyebrow pt-4">© {currentYear} Welfare Match</p>
    </footer>
  );
}
