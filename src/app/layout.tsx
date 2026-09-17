import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Gnb } from "@/components/Gnb/Gnb";
import "./globals.scss";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "motivo society", template: "%s · motivo society" },
  description: "배우고, 만들고, 발견하는 테크 기반 컬쳐클럽",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Gnb />
        {children}
      </body>
    </html>
  );
}
