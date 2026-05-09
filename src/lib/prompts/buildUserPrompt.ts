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

위 프로필에 맞춰 ① 중앙정부 ② ${region.sido} ③ ${region.sigungu} 3계층 혜택을 안내해 주세요.

[검증 규칙 — 위반 시 환각으로 간주, 응답에서 해당 사업 삭제]
- 각 사업은 web_search 결과에서 ${currentYear}년 또는 ${currentYear - 1}년 시행 정보를 본문으로 확인한 후 인용. 시행 연도가 확인 안 되면 안내 금지.
- ② 광역시도 사업: 다음 중 하나를 만족할 때만 안내. 둘 다 미충족이면 "② ${region.sido}: 확인된 사업 없음" 으로 명시.
  (a) "${region.sido}" 명칭 또는 그 영문 도메인이 URL 호스트·경로에 포함된 출처가 web_search 결과에 있는 경우 → 그 URL 인용
  (b) [사전 후보 메모(시드 KB)] 에 ${region.sido} 사업으로 명시된 경우 → KB 의 「공식」 URL 인용 가능 (단, 본문에 "최신 자격·공고는 ${region.sido} 공식 사이트 또는 거주지 행정복지센터에서 확인 권장" 함께 표기)
- ③ 기초자치단체 사업: 다음 중 하나를 만족할 때만 안내. 둘 다 미충족이면 "③ ${region.sigungu}: 확인된 사업 없음 — 거주지 행정복지센터 문의 권장" 명시. 다른 시·군·구 자료를 ${region.sigungu} 사업으로 일반화 금지.
  (a) "${region.sigungu}" 명칭(한글 또는 로마자)이 URL 호스트·경로에 포함된 출처가 web_search 결과에 있는 경우 → 그 URL 인용
  (b) [사전 후보 메모(시드 KB)] 에 ${region.sigungu} 사업으로 명시된 경우 → KB 의 「공식」 URL 인용 가능 (단, 본문에 "최신 자격은 ${region.sigungu} 행정복지센터 또는 자치구 공식 사이트에서 확인 권장" 함께 표기)
- 다른 시·도/시·군·구의 유사 사업명을 ${region.sido} ${region.sigungu} 사업으로 일반화·유추 금지.
- 인용 URL 은 web_search 결과에 등장한 정확한 URL 또는 시드 KB 의 「공식」 URL 만 표기 (도메인·경로·쿼리·해시 변경 금지, URL 합성 금지).
- ③ 계층 사업이 1차 검색으로 미확인이면 "${region.sido} ${region.sigungu} <사업명> ${currentYear}" 쿼리로 1회 이상 추가 검색 후 판단.
- 각 사업의 「출처」와 「신청 경로」는 반드시 markdown 링크 [표시 텍스트](전체 URL) 형식으로 본문에 포함 (도메인 이름만 적거나 URL 만 단독으로 적는 것 금지). 응답 하단 자동 인용 목록은 본문 markdown 링크에서만 추출됩니다.
- 사용자 나이 ${age}세 / 가구원수 ${household.size}명 / 결혼 ${marital.status === "married" ? "결혼" : "미혼/1인"} 와 자격이 명백히 불일치하는 사업은 안내 절대 금지. 예: 청년 한정 사업(19~34세)을 65세 사용자에게, 신혼부부 사업을 미혼/1인 가구에게, 한부모 사업을 자녀 없는 가구에게 안내 금지.
- 보건복지부·고용노동부·국토교통부·금융위원회 등 중앙부처가 운영·법령 근거를 가진 전국 공통 사업(기초연금·노인맞춤돌봄·노인일자리·국민취업지원·청년도약계좌·버팀목 대출 등)은 ① 중앙정부 에만 안내. ② ③ 에 중복 분류 금지.
- 자체 점검 결과·검증 경고·체크리스트 결과 등 메타 메시지는 응답 본문에 출력 금지 (서버가 필요 시 자동 첨부).
- 서버는 응답 종료 후 ② ③ 계층 사업이 거주지 도메인 출처를 인용했는지 자동 검증하며, 미통과 시 "⚠ 자동 검증 경고" 가 응답 말미에 자동 첨부됩니다.`;
}
