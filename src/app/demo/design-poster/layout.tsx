import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DraftBar } from "./_bar";
import s from "./poster.module.scss";

export const metadata: Metadata = {
  title: "포스터 시안",
  robots: { index: false, follow: false },
};

/**
 * "포스터" 톤 시안(2026-11-13, 승우 요청 — 작업 노트 시안과 다른 방향).
 * AGENTS.md의 시네마틱 브랜드 규칙을 제품 화면까지 그대로 적용한 안. 고정 예시 데이터, 표지는 연출용 생성 이미지.
 */
export default function PosterLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className={s.root}>
      <DraftBar />
      {children}
    </main>
  );
}
