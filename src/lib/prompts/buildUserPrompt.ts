import type { UserProfile } from "@/lib/schema";
import { SITUATION_LABELS } from "@/lib/schema";
import {
  INCOME_DATA_YEAR,
  incomeBracketLabel,
  medianIncomeForHousehold,
  medianIncomePercentile,
} from "@/lib/income";

const winston = (n: number) => n.toLocaleString("ko-KR");

export function buildUserPrompt(args: {
  profile: UserProfile;
  kbSnippets: string;
  currentYear: number;
}): string {
  const { profile, kbSnippets, currentYear } = args;
  const { region, age, household, marital, children, situations, freeText } =
    profile;

  const totalIncome =
    household.monthlyIncomeKRW +
    (marital.status === "married" ? marital.spouseMonthlyIncomeKRW : 0);
  const median = medianIncomeForHousehold(household.size);
  const percentile = medianIncomePercentile(household.size, totalIncome);
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
      ? `결혼(배우자 ${marital.spouseAge}세, 월소득 ₩${winston(marital.spouseMonthlyIncomeKRW)})`
      : "미혼/사별/이혼 등 1인 가구 또는 비혼";

  return `[사용자 프로필]
- 거주지: ${region.sido} ${region.sigungu} (법정동코드 ${region.sigunguCode})
- 나이: ${age}세
- 가구원수: ${household.size}명 / 본인 월소득: ₩${winston(household.monthlyIncomeKRW)}
- 결혼: ${maritalLine}
- 자녀: ${childrenLine}
- 추가 상황: ${situationLine}
- 자유 질문: ${freeText && freeText.length > 0 ? freeText : "(없음)"}

[자동 계산 — 참고용]
- ${INCOME_DATA_YEAR}년 고시 기준 가구원수 ${household.size}명의 월 기준 중위소득: ₩${winston(median)}
- 가구합산 월 소득: ₩${winston(totalIncome)}
- 기준 중위소득 대비 약 ${percentile}% — ${bracket}

[현재 연도]
${currentYear}

[사전 후보 메모(시드 KB — 반드시 web_search로 최신성 검증 후 사용)]
${kbSnippets}

위 프로필에 맞춰 ① 중앙정부 ② ${region.sido} ③ ${region.sigungu} 3계층 혜택을 안내해 주세요. 각 사업은 web_search로 ${currentYear}년 시행 여부를 확인한 후 인용하시고, 출처 URL을 반드시 표기해 주세요.`;
}
