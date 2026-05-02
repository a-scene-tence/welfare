/**
 * Toss Design System(TDS) 매핑 — 앱인토스 빌드 시 사용.
 * 실제 TDS 토큰 값은 Phase 2에서 Figma/리소스 센터로부터 받아 채워 넣는다.
 * 현재는 자체 테마와 동일 형태의 placeholder로 둔다.
 */
import { theme as defaultTheme } from "./theme";

export const tdsTheme: typeof defaultTheme = {
  ...defaultTheme,
  color: {
    ...defaultTheme.color,
    brand: "#3182f6",
    brandFg: "#ffffff",
  },
};
