/**
 * 개인정보 마스킹 유틸. opt-in 동의자 대화 이력을 DB에 저장하기 전 호출.
 *
 * 원칙:
 * - 식별자(이름·전화·이메일·주민번호·계좌·카드번호 후보)는 정규식으로 제거
 * - 소득은 100만원 단위 버킷
 * - 거주지는 시도까지만(시군구 미저장)
 * - 자유텍스트는 길이 제한 후 PII 패턴 마스킹
 */

const PHONE_RE = /\b\d{2,3}[- ]?\d{3,4}[- ]?\d{4}\b/g;
const EMAIL_RE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
const RRN_RE = /\b\d{6}[- ]?[1-4]\d{6}\b/g; // 주민등록번호 후보
const ACCOUNT_RE = /\b\d{2,6}[- ]?\d{2,6}[- ]?\d{2,8}\b/g; // 은행 계좌 후보
const CARD_RE = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;
const KOREAN_NAME_HINT_RE = /([가-힣]{2,4})(님|씨|군|양)\b/g;

export function maskFreeText(input: string | undefined | null): string {
  if (!input) return "";
  return input
    .slice(0, 500)
    .replace(CARD_RE, "[CARD]")
    .replace(RRN_RE, "[RRN]")
    .replace(ACCOUNT_RE, (m) => (m.replace(/\D/g, "").length >= 10 ? "[ACCT]" : m))
    .replace(PHONE_RE, "[PHONE]")
    .replace(EMAIL_RE, "[EMAIL]")
    .replace(KOREAN_NAME_HINT_RE, "[NAME]$2");
}

/**
 * 월 소득(원)을 100만원 단위 버킷으로 변환. 예: 2_300_000 → "월 200만~300만".
 * 1000만 초과는 단일 라벨.
 */
export function bucketIncome(monthlyKRW: number): string {
  if (monthlyKRW < 0) return "미상";
  if (monthlyKRW === 0) return "0원";
  const millions = Math.floor(monthlyKRW / 1_000_000);
  if (millions >= 10) return "월 1000만 초과";
  return `월 ${millions * 100}만~${(millions + 1) * 100}만`;
}

/**
 * 연 총급여(원)를 1000만원 단위 버킷으로 변환. 예: 36_000_000 → "연 3000만~4000만".
 * 5억 초과는 단일 라벨.
 */
export function bucketAnnualIncome(annualKRW: number): string {
  if (annualKRW < 0) return "미상";
  if (annualKRW === 0) return "0원";
  const tensOfMillions = Math.floor(annualKRW / 10_000_000);
  if (tensOfMillions >= 50) return "연 5억 초과";
  return `연 ${tensOfMillions * 1000}만~${(tensOfMillions + 1) * 1000}만`;
}

/**
 * 나이 5세 단위 버킷. 예: 32 → "30대 초반".
 */
export function bucketAge(age: number): string {
  if (age < 0) return "미상";
  if (age < 10) return "10세 미만";
  const decade = Math.floor(age / 10) * 10;
  const rem = age % 10;
  const half = rem < 5 ? "초반" : "후반";
  if (age >= 80) return "80세 이상";
  return `${decade}대 ${half}`;
}

/**
 * 가구원수 버킷.
 */
export function bucketHouseholdSize(size: number): string {
  if (size <= 0) return "미상";
  if (size === 1) return "1인";
  if (size === 2) return "2인";
  if (size <= 4) return "3~4인";
  if (size <= 6) return "5~6인";
  return "7인 이상";
}

export type MaskedProfile = {
  sido: string;
  ageBucket: string;
  householdBucket: string;
  incomeBucket: string;
  maritalStatus: "single" | "married";
  spouseAgeBucket?: string;
  spouseIncomeBucket?: string;
  hasChildren: boolean;
  childCount: number;
  situations: string[];
  freeTextMasked: string;
};

export function maskProfile(profile: {
  region: { sido: string };
  age: number;
  household: { size: number; annualIncomeKRW: number };
  marital:
    | { status: "single" }
    | { status: "married"; spouseAge: number; spouseAnnualIncomeKRW: number };
  children: { age: number }[];
  situations: string[];
  freeText?: string;
}): MaskedProfile {
  const base: MaskedProfile = {
    sido: profile.region.sido,
    ageBucket: bucketAge(profile.age),
    householdBucket: bucketHouseholdSize(profile.household.size),
    incomeBucket: bucketAnnualIncome(profile.household.annualIncomeKRW),
    maritalStatus: profile.marital.status,
    hasChildren: profile.children.length > 0,
    childCount: profile.children.length,
    situations: profile.situations,
    freeTextMasked: maskFreeText(profile.freeText),
  };
  if (profile.marital.status === "married") {
    base.spouseAgeBucket = bucketAge(profile.marital.spouseAge);
    base.spouseIncomeBucket = bucketAnnualIncome(profile.marital.spouseAnnualIncomeKRW);
  }
  return base;
}
