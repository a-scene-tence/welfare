import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";

export const metadata: Metadata = {
  title: "복지매칭 — 대한민국 공공 복지 혜택 안내",
  description:
    "거주지·나이·소득·가구 상황을 입력하면 받을 수 있는 중앙정부·광역시도·기초자치단체 복지 혜택을 한 번에 안내합니다.",
  metadataBase: new URL("https://welfare.example.kr"),
  openGraph: {
    title: "복지매칭",
    description: "공공 복지 혜택 매칭 에이전트",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto max-w-3xl px-6 md:px-10 py-8 safe-bottom">
          <header className="border-b border-[color:var(--line)] pb-7">
            <Link href="/" className="block no-underline">
              <p className="eyebrow">Korea Public Welfare Matcher</p>
              <h1 className="font-display text-3xl md:text-5xl font-black tracking-tight mt-2 leading-[1.05] text-[color:var(--ink)]">
                복지매칭
              </h1>
            </Link>
            <p className="text-sm text-[color:var(--muted)] mt-3">
              내가 받을 수 있는 공공 복지 혜택을 한 번에.
            </p>
            <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest2 text-[color:var(--muted)]">
              <Link href="/" className="no-underline hover:text-[color:var(--ink)]">
                Home
              </Link>
              <Link
                href="/about"
                className="no-underline hover:text-[color:var(--ink)]"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="no-underline hover:text-[color:var(--ink)]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="no-underline hover:text-[color:var(--ink)]"
              >
                Terms
              </Link>
            </nav>
          </header>
          <main className="mt-10">{children}</main>
          <DisclaimerFooter />
        </div>
      </body>
    </html>
  );
}
