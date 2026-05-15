import { defineConfig } from "@playwright/test";

/**
 * Playwright 설정 — 회귀 테스트 자동화 E2E.
 *
 * API 직접 호출 방식 (브라우저 자동화 X). 실제 LLM (Upstage) + Tavily 호출 발생.
 * Codespaces 또는 로컬에서 dev server 가 자동 시작.
 *
 * 실행: pnpm test:e2e
 * 환경 변수: UPSTAGE_API_KEY, TAVILY_API_KEY (필수).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
