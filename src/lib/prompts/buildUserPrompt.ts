import type { UserProfile } from "@/lib/schema";
import { SITUATION_LABELS } from "@/lib/schema";
import {
  INCOME_DATA_YEAR,
  annualToMonthly,
  incomeBracketLabel,
  medianIncomeForHousehold,
  medianIncomePercentile,
} from "@/lib/income";

const won = (n: number) => n.toLocaleString("ko-KR");

export function buildUserPrompt(args: {
  profile: UserProfile;
  kbSnippets: string;
  currentYear: number;
}): string {
  const { profile, kbSnippets, currentYear } = args;
  const { region, age, household, marital, children, situations, freeText } =
    profile;

  const annualTotal =
    household.annualIncomeKRW +
    (marital.status === "married" ? marital.spouseAnnualIncomeKRW : 0);
  const monthlyTotal = annualToMonthly(annualTotal);
  const median = medianIncomeForHousehold(household.size);
  const percentile = medianIncomePercentile(household.size, monthlyTotal);
  const bracket = incomeBracketLabel(percentile);

  const childrenLine =
    children.length === 0
      ? "없음"
      : children.map((c) => `${c.age}세`).join(", ");

  const situationLabels = situations
    .filter((s) => s !== "none")
    .map((s) => SITUATION_LABELS[s]);
  const situationLine =
    situationLabels.length > 0 ? situationLabels.join(", ") : "특이사항 없음";

  const maritalLine =
    marital.status === "married"
      ? `결혼(배우자 ${marital.spouseAge}세, 연 총급여 ₩${won(marital.spouseAnnualIncomeKRW)})`
      : "미혼/사별/이혼 등 1인 가구 또는 비혼";

  return `[사용자 프로필]
- 거주지: ${region.sido} ${region.sigungu} (법정동코드 ${region.sigunguCode})
- 나이: ${age}세
- 가구원수: ${household.size}명 / 본인 연 총급여: ₩${won(household.annualIncomeKRW)}
- 결혼: ${maritalLine}
- 자녀: ${childrenLine}
- 추가 상황: ${situationLine}
- 자유 질문: ${freeText && freeText.length > 0 ? freeText : "(없음)"}

[자동 계산 — 참고용]
- ${INCOME_DATA_YEAR}년 고시 기준 가구원수 ${household.size}명의 월 기준 중위소득: ₩${won(median)}
- 가구합산 연 총급여: ₩${won(annualTotal)}
- 가구합산 월 환산 소득(÷12): ₩${won(monthlyTotal)}
- 기준 중위소득 대비 약 ${percentile}% — ${bracket}

[소득 단위 환산 안내]
- 입력값은 본인·배우자 연 총급여(세전).
- 기준 중위소득 % 기반 사업 → 위 「월 환산 소득」으로 비교.
- 연 단위 사업(청년도약계좌 등 총급여 기준) → 위 「가구합산 연 총급여」 또는 본인 연 총급여를 그대로 비교.
- 종합소득금액 기준 사업(근로/자녀장려금 등) → 단순 환산이 부정확하므로 「홈택스 또는 보건복지상담센터(129) 문의 권장」으로 안내.

[현재 연도]
${currentYear}

[사전 후보 메모(시드 KB — 반드시 web_search로 최신성 검증 후 사용)]
${kbSnippets}

위 프로필에 맞춰 ① 중앙정부 ② ${region.sido} ③ ${region.sigungu} 3계층 혜택을 안내해 주세요. 각 사업은 web_search로 ${currentYear}년 시행 여부를 확인한 후 인용하시고, 출처 URL을 반드시 표기해 주세요.`;
}
