import type { KbProgram } from "./loader";
import type { UserProfile } from "@/lib/schema";
import {
  annualToMonthly,
  medianIncomeForHousehold,
  medianIncomePercentile,
} from "@/lib/income";

/**
 * 사용자 프로필 → 후보 사업 추출. 자격이 명시된 경우만 strict 매칭, 그 외는 통과.
 *
 * region 매칭: sido 가 명시된 사업은 거주 sido 와 일치해야 후보. sigungu 가 명시
 * 된 사업은 거주 sigungu 와도 일치해야 후보. 미명시(중앙 사업)는 통과.
 *
 * 정렬 우선순위: 기초자치단체(sigungu) > 광역(sido) > 중앙. ② ③ 보류율 감소 목적.
 */
export function filterPrograms(
  programs: KbProgram[],
  profile: UserProfile,
  limit = 25,
): KbProgram[] {
  const annualTotal =
    profile.household.annualIncomeKRW +
    (profile.marital.status === "married"
      ? profile.marital.spouseAnnualIncomeKRW
      : 0);
  const monthlyTotal = annualToMonthly(annualTotal);
  const userPercentile = medianIncomePercentile(
    profile.household.size,
    monthlyTotal,
  );
  void medianIncomeForHousehold(profile.household.size); // ensure data loaded

  const matched = programs.filter((p) => {
    const e = p.eligibility ?? {};
    if (e.ageMin !== undefined && profile.age < e.ageMin) return false;
    if (e.ageMax !== undefined && profile.age > e.ageMax) return false;
    if (
      e.incomePercentile !== undefined &&
      userPercentile > e.incomePercentile
    ) {
      return false;
    }
    if (e.situations?.length) {
      const userSituations = new Set(profile.situations);
      if (!e.situations.some((s) => userSituations.has(s as never))) {
        return false;
      }
    }
    if (p.region?.sido && p.region.sido !== profile.region.sido) return false;
    if (p.region?.sigungu && p.region.sigungu !== profile.region.sigungu)
      return false;
    return true;
  });
  matched.sort((a, b) => regionPriority(b) - regionPriority(a));
  return matched.slice(0, limit);
}

function regionPriority(p: KbProgram): number {
  if (p.region?.sigungu) return 2;
  if (p.region?.sido) return 1;
  return 0;
}
