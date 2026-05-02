/**
 * 앱인토스(WebView) 환경 감지. 클라이언트에서만 의미 있음.
 */
export function isAppsInTossEnv(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  return /toss/i.test(ua) || (window as unknown as { tossSdk?: unknown }).tossSdk !== undefined;
}

export const APPSINTOSS_BUILD = process.env.NEXT_PUBLIC_TARGET === "appsintoss";
