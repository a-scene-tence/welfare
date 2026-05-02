/**
 * 앱인토스 환경에서 외부 링크는 토스 SDK의 외부 브라우저 호출로 라우팅.
 * SDK 미주입 시 일반 새 탭으로 폴백.
 */
import { isAppsInTossEnv } from "./env";

export function openExternal(url: string): void {
  if (typeof window === "undefined") return;
  const sdk = (window as unknown as { tossSdk?: { openExternal?: (u: string) => void } })
    .tossSdk;
  if (isAppsInTossEnv() && sdk?.openExternal) {
    sdk.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
