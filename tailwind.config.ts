import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,md}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Pretendard",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          fg: "var(--brand-fg)",
        },
        surface: "var(--surface)",
        muted: "var(--muted)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        line: "var(--line)",
        accent: "var(--accent)",
        bg: "var(--bg)",
      },
      letterSpacing: {
        widest2: "0.2em",
      },
    },
  },
  plugins: [],
};

export default config;
