import { WelfareForm } from "@/components/WelfareForm";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-white border border-[var(--border)] p-4">
        <h1 className="text-xl font-bold mb-1">받을 수 있는 복지 혜택을 한 번에</h1>
        <p className="text-sm text-[var(--muted)]">
          거주 지역과 가구 상황을 입력하면, 공식 출처를 기반으로 중앙정부·광역시도·시·군·구의
          복지 혜택을 모아 안내해 드립니다. 입력값은 서버에 저장되지 않습니다(동의 시 비식별
          처리만).
        </p>
      </section>
      <WelfareForm />
    </div>
  );
}
