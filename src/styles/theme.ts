/**
 * 디자인 토큰 — W컨셉 풍 모노톤 + 다크 액센트 (기본 테마).
 * 앱인토스 빌드(`NEXT_PUBLIC_TARGET=appsintoss`)에서는 theme.tds.ts로 swap.
 */
export type ThemeShape = {
  color: Record<string, string>;
  radius: Record<string, string>;
  font: Record<string, string>;
  letterSpacing: Record<string, string>;
};

export const theme: ThemeShape = {
  color: {
    ink: "#111111",
    inkSoft: "#2a2a2a",
    surface: "#ffffff",
    surfaceAlt: "#fafafa",
    text: "#111111",
    textMuted: "#6b6b6b",
    line: "#e6e6e6",
    accent: "#2a2a3a",
    danger: "#c4302b",
    success: "#1f6f43",
    // 호환성 alias
    brand: "#111111",
    brandFg: "#ffffff",
    border: "#e6e6e6",
  },
  radius: {
    none: "0px",
    sm: "2px",
    md: "4px",
    lg: "8px",
  },
  font: {
    eyebrow: "10px",
    sm: "13px",
    base: "15px",
    lg: "17px",
    xl: "20px",
    h2: "28px",
    h1: "40px",
  },
  letterSpacing: {
    tight: "-0.01em",
    normal: "0",
    wide: "0.04em",
    widest: "0.2em",
  },
};

export type Theme = typeof theme;
