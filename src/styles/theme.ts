/**
 * 디자인 토큰 — 자체 테마(기본).
 * 앱인토스 빌드(`NEXT_PUBLIC_TARGET=appsintoss`)에서는 theme.tds.ts로 swap.
 */
export const theme = {
  color: {
    brand: "#3182f6",
    brandFg: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#f7f8fa",
    text: "#191f28",
    textMuted: "#4e5968",
    border: "#e5e8eb",
    danger: "#f04452",
    success: "#1aab5a",
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
  },
  font: {
    sm: "13px",
    base: "15px",
    lg: "17px",
    xl: "20px",
    h1: "26px",
  },
} as const;

export type Theme = typeof theme;
