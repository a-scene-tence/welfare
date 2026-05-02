/**
 * 앱인토스 인앱 광고(IAA) 어댑터 — Phase 2 stub.
 * 응답 하단 슬롯에 노출 예정.
 */
export type IaaSlot = "answer_bottom" | "form_bottom";

export async function loadIaaSlot(_slot: IaaSlot): Promise<{ html: string } | null> {
  return null;
}
