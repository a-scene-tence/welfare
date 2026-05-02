/**
 * 토스 로그인 어댑터 — Phase 2 게시 단계에서 실 SDK로 교체.
 * 활성 시 사용자 동의 하에 생년월일·이름을 받아 나이를 자동 채울 수 있다.
 */
export type TossUserHint = {
  age?: number;
  name?: string;
};

export async function getTossUserHint(): Promise<TossUserHint | null> {
  // TODO(Phase 2): @apps-in-toss/sdk 또는 토스 인증 API 연동
  return null;
}
