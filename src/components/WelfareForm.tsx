"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegionSelect } from "./RegionSelect";
import { IncomeInput } from "./IncomeInput";
import { MaritalSection } from "./MaritalSection";
import { SituationsCheckbox } from "./SituationsCheckbox";
import { ConsentBlock } from "./ConsentBlock";
import { ApiKeyInput } from "./ApiKeyInput";
import { UserProfileSchema, type Marital, type Situation } from "@/lib/schema";

type RegionState = {
  sido: string;
  sigungu: string;
  sidoCode: string;
  sigunguCode: string;
};

/** 모노톤·언더라인 입력 공통 클래스. */
export const UNDERLINE_INPUT =
  "w-full border-0 border-b border-[color:var(--line)] bg-transparent px-0 py-3 text-base rounded-none focus:outline-none focus:border-[color:var(--ink)] transition-colors";

export function WelfareForm() {
  const router = useRouter();
  const [region, setRegion] = useState<RegionState>({
    sido: "",
    sigungu: "",
    sidoCode: "",
    sigunguCode: "",
  });
  const [age, setAge] = useState<number>(30);
  const [size, setSize] = useState<number>(1);
  const [income, setIncome] = useState<number>(0);
  const [marital, setMarital] = useState<Marital>({ status: "single" });
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [situations, setSituations] = useState<Situation[]>(["none"]);
  const [freeText, setFreeText] = useState<string>("");
  const [consent, setConsent] = useState({
    disclaimer: false,
    storeAnonymizedLog: false,
  });
  const [byokKey, setByokKey] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const profile = {
      region,
      age,
      household: { size, annualIncomeKRW: income },
      marital,
      children: Array.from({ length: childrenCount }, () => ({ age: 0 })),
      situations,
      freeText: freeText.trim() || undefined,
      consent,
    };
    const parsed = UserProfileSchema.safeParse(profile);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(" / "),
      );
      return;
    }
    try {
      sessionStorage.setItem("welfare:profile", JSON.stringify(parsed.data));
      if (byokKey) sessionStorage.setItem("welfare:byok", byokKey);
      else sessionStorage.removeItem("welfare:byok");
    } catch {
      // sessionStorage 비활성 환경(앱인토스 일부)에서는 URL로 전달
    }
    router.push("/chat");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <section>
        <RegionSelect
          sidoCode={region.sidoCode}
          sigunguCode={region.sigunguCode}
          onChange={setRegion}
        />
      </section>

      <section className="grid grid-cols-2 gap-6">
        <label className="block">
          <span className="eyebrow block">Age</span>
          <span className="block text-sm font-medium mt-1 text-[color:var(--ink)]">
            본인 나이
          </span>
          <input
            type="number"
            min={0}
            max={120}
            value={age || ""}
            onChange={(e) => setAge(Number(e.target.value) || 0)}
            className={UNDERLINE_INPUT}
          />
        </label>
        <label className="block">
          <span className="eyebrow block">Children</span>
          <span className="block text-sm font-medium mt-1 text-[color:var(--ink)]">
            자녀 수
          </span>
          <input
            type="number"
            min={0}
            max={10}
            value={childrenCount}
            onChange={(e) => setChildrenCount(Number(e.target.value) || 0)}
            className={UNDERLINE_INPUT}
          />
        </label>
      </section>

      <section>
        <IncomeInput
          size={size}
          annualIncomeKRW={income}
          spouseAnnualIncomeKRW={
            marital.status === "married" ? marital.spouseAnnualIncomeKRW : 0
          }
          onChangeSize={setSize}
          onChangeIncome={setIncome}
        />
      </section>

      <section>
        <MaritalSection marital={marital} onChange={setMarital} />
      </section>

      <section>
        <SituationsCheckbox values={situations} onChange={setSituations} />
      </section>

      <section>
        <label className="block">
          <span className="eyebrow block">Free text</span>
          <span className="block text-sm font-medium mt-1 text-[color:var(--ink)]">
            추가 질문 / 특별한 상황 (선택, 500자 이내)
          </span>
          <textarea
            rows={3}
            maxLength={500}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="예: 최근 실직했고 임차 보증금 마련이 어렵습니다."
            className={`${UNDERLINE_INPUT} resize-none`}
          />
          <span className="block text-xs text-[color:var(--muted)] mt-2">
            전화번호·주민번호·계좌번호 등은 입력하지 마세요. 입력 시 자동 마스킹됩니다.
          </span>
        </label>
      </section>

      <ConsentBlock
        disclaimer={consent.disclaimer}
        storeAnonymizedLog={consent.storeAnonymizedLog}
        onChange={setConsent}
      />

      <ApiKeyInput value={byokKey} onChange={setByokKey} />

      {error && (
        <p className="text-sm text-[color:var(--danger,#c4302b)] border-l-2 border-[color:var(--danger,#c4302b)] pl-3 py-1">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!consent.disclaimer}
        className="w-full bg-[color:var(--ink)] text-white py-4 text-xs tracking-widest2 uppercase font-medium border border-[color:var(--ink)] rounded-none transition-colors hover:bg-white hover:text-[color:var(--ink)] disabled:bg-[color:var(--line)] disabled:border-[color:var(--line)] disabled:text-[color:var(--muted)] disabled:cursor-not-allowed disabled:hover:bg-[color:var(--line)] disabled:hover:text-[color:var(--muted)]"
      >
        Match welfare programs · 복지 혜택 찾기
      </button>
    </form>
  );
}
