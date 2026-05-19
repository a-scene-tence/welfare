import { DISCLAIMER_TEXT } from "@/lib/prompts/disclaimer";

export const metadata = { title: "이용약관·면책 — 복지매칭" };

export default function TermsPage() {
  return (
    <article className="prose-welfare space-y-5 text-sm leading-7">
      <p className="eyebrow">Terms</p>
      <h1 className="font-display text-2xl md:text-4xl font-black tracking-tight leading-tight text-[color:var(--ink)]">
        이용약관 · 면책 사항
      </h1>
      <p>
        「복지매칭」(이하 “서비스”)은 일반 대중에게 공공 복지 정보를 안내하는 비공식 도구이며,
        대한민국 정부의 공식 서비스가 아닙니다.
      </p>
      <h2>면책 사항</h2>
      <blockquote>{DISCLAIMER_TEXT}</blockquote>
      <h2>금지 행위</h2>
      <ul>
        <li>타인의 개인정보(주민번호·계좌·전화 등) 입력</li>
        <li>본 서비스 응답을 가공하여 정부 공식 안내인 것처럼 오인하게 하는 행위</li>
        <li>자동화된 대량 호출(rate limit 우회)</li>
      </ul>
      <h2>책임의 제한</h2>
      <p>
        본 서비스의 안내 정보로 인한 의사결정·신청 결과·재산상 손해에 대하여 운영자는 어떠한
        법적 책임도 지지 않습니다. 신청 전 반드시 보건복지상담센터(국번없이 <strong>129</strong>)
        또는 거주지 행정복지센터에서 최종 확인하시기 바랍니다.
      </p>
    </article>
  );
}
