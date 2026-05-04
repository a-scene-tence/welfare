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
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="space-y-3">
        <RegionSelect
          sidoCode={region.sidoCode}
          sigunguCode={region.sigunguCode}
          onChange={setRegion}
        />
      </section>

      <section className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-sm font-medium mb-1">본인 나이</span>
          <input
            type="number"
            min={0}
            max={120}
            value={age || ""}
            onChange={(e) => setAge(Number(e.target.value) || 0)}
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">자녀 수</span>
          <input
            type="number"
            min={0}
            max={10}
            value={childrenCount}
            onChange={(e) => setChildrenCount(Number(e.target.value) || 0)}
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
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
          <span className="block text-sm font-medium mb-1">
            추가 질문 / 특별한 상황 (선택, 500자 이내)
          </span>
          <textarea
            rows={3}
            maxLength={500}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="예: 최근 실직했고 임차 보증금 마련이 어렵습니다."
            className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-base"
          />
          <span className="block text-xs text-[var(--muted)] mt-1">
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
        <p className="text-sm text-[color:var(--danger,#f04452)] bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!consent.disclaimer}
        className="w-full rounded-lg bg-[var(--brand)] text-white font-semibold py-3 disabled:bg-gray-300"
      >
        받을 수 있는 복지 혜택 찾기
      </button>
    </form>
  );
}
