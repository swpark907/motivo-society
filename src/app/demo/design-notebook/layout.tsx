import type { Metadata } from "next";
import { Syne } from "next/font/google";
import { notFound } from "next/navigation";
import { DraftBar } from "./_bar";
import s from "./notebook.module.scss";

// 대표가 motivo.kr에서 쓰는 브랜드 라틴·숫자 서체 Syne. 본문은 motivo.kr에서 실제로 보이는 시스템 고딕을 쓴다
// (motivo.kr의 Gothic A1은 latin 묶음만 불러와 한글은 시스템 고딕으로 보인다. 개발 서버에서 Gothic A1 전체 불러오기는 실패).
const syne = Syne({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-syne" });

export const metadata: Metadata = {
  title: "작업 노트 시안",
  robots: { index: false, follow: false },
};

/**
 * "작업 노트" 톤 시안(2026-11-13, 승우 요청). 대표의 motivo.kr 랜딩과 회원 공간 톤을 플랫폼으로 잇는다.
 * 고정 예시 데이터만 쓰고 DB와 연결하지 않는다. 표지는 연출용 생성 이미지.
 */
export default function NotebookLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className={`${syne.variable} ${s.root}`}>
      <DraftBar />
      {children}
    </main>
  );
}
