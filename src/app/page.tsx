import { WelfareForm } from "@/components/WelfareForm";

const currentYear = new Date().getFullYear();

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="border-b border-[color:var(--line)] pb-10">
        <p className="eyebrow">Welfare Match · {currentYear}</p>
        <h2 className="font-display text-2xl md:text-4xl font-black tracking-tight mt-3 leading-[1.1] text-[color:var(--ink)]">
          받을 수 있는 복지 혜택을,
          <br />한 번에.
        </h2>
        <p className="text-sm md:text-base text-[color:var(--muted)] mt-5 leading-relaxed max-w-prose">
          거주지·나이·가구 소득·결혼·자녀 정보를 입력하면 중앙정부·광역시도·기초자치단체
          3계층의 공공 복지를 한 번에 안내합니다. 보편 복지부터 거주지 자체 사업까지,
          공식 출처를 근거로.
        </p>
        <p className="text-xs text-[color:var(--muted)] mt-4">
          입력값은 서버에 저장되지 않으며, 동의 시에만 비식별 처리되어 운영
          분석에 사용됩니다.
        </p>
      </section>
      <WelfareForm />
    </div>
  );
}
