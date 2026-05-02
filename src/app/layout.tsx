import type { Metadata, Viewport } from "next";
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
  themeColor: "#3182f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto max-w-2xl px-4 py-6 safe-bottom">
          <header className="mb-6">
            <a
              href="/"
              className="text-xl font-bold text-[color:var(--brand)] no-underline"
            >
              복지매칭
            </a>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              내가 받을 수 있는 공공 복지 혜택을 한 번에
            </p>
          </header>
          <main>{children}</main>
          <DisclaimerFooter />
        </div>
      </body>
    </html>
  );
}
