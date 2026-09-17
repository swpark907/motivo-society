import type { Metadata } from "next";
import { Anton, Black_Han_Sans } from "next/font/google";
import { Gnb } from "@/components/Gnb/Gnb";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.scss";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const blackHan = Black_Han_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-han",
});

export const metadata: Metadata = {
  title: { default: "motivo society", template: "%s · motivo society" },
  description: "배우고, 만들고, 발견하는 테크 기반 컬쳐클럽",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${anton.variable} ${blackHan.variable}`}>
      <body>
        <Gnb />
        {children}
      </body>
    </html>
  );
}
