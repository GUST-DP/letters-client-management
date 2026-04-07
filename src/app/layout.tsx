import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "900"],
  variable: "--font-noto-serif",
});

export const metadata: Metadata = {
  title: "LETUS 고객사 관리 플랫폼",
  description: "LETUS 풀필먼트 서비스 고객사 관리 및 지표 분석 대시보드",
};

import { LoadingProvider } from "@/components/providers/loading-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${notoSerifKR.variable} font-serif antialiased bg-[#f5eee8]`}
        suppressHydrationWarning
      >
        <LoadingProvider>
          {children}
          <Toaster position="top-center" />
        </LoadingProvider>
      </body>
    </html>
  );
}
