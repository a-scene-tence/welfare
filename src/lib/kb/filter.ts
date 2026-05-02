import type { KbProgram } from "./loader";
import type { UserProfile } from "@/lib/schema";
import {
  medianIncomeForHousehold,
  medianIncomePercentile,
} from "@/lib/income";

/**
 * 사용자 프로필 → 후보 사업 추출. 자격이 명시된 경우만 strict 매칭, 그 외는 통과.
 */
export function filterPrograms(
  programs: KbProgram[],
  profile: UserProfile,
  limit = 15,
): KbProgram[] {
  const totalIncome =
    profile.household.monthlyIncomeKRW +
    (profile.marital.status === "married"
      ? profile.marital.spouseMonthlyIncomeKRW
      : 0);
  const userPercentile = medianIncomePercentile(
    profile.household.size,
    totalIncome,
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
    return true;
  });
  return matched.slice(0, limit);
}
