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
      },
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          fg: "var(--brand-fg)",
        },
        surface: "var(--surface)",
        muted: "var(--muted)",
      },
    },
  },
  plugins: [],
};

export default config;
