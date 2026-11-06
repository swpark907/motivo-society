import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DraftTabs } from "./_tabs";
import s from "./design.module.scss";

export const metadata: Metadata = {
  title: "플랫폼 디자인 시안",
  robots: { index: false, follow: false },
};

export default function DesignDraftLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className={`paper ${s.page}`}>
      <div className={s.inner}>
        <div style={{ display: "grid", gap: "8px" }}>
          <span className={s.draftNote}>
            디자인 시안 · 고정 예시 데이터 · 표지는 연출용 생성 이미지
          </span>
          <DraftTabs />
        </div>
        {children}
      </div>
    </main>
  );
}
