import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MobileDraftNav } from "./_nav";
import s from "./mobile.module.scss";

export const metadata: Metadata = {
  title: "모바일 앱 시안",
  robots: { index: false, follow: false },
};

/**
 * 모바일 앱 문법 시안(2026-11-10, 검수 뒤 승우 요청). 고정 예시 데이터만 쓰고 DB와 연결하지 않는다.
 * 넓은 화면: 왼쪽 설명 + 가운데 휴대폰 틀(390×844). 좁은 화면: 시안 화면이 화면 전체를 덮는다.
 */
export default function MobileDraftLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className={`paper ${s.stage}`}>
      <aside className={s.notes}>
        <p className="label">MOBILE APP DRAFT</p>
        <h1 className={s.notesTitle}>모바일 앱 문법 시안</h1>
        <p className={s.notesLead}>
          지금 화면은 데스크톱 웹을 좁힌 꼴이다. 같은 내용을 앱 문법으로 다시 짠 세 장. 고정 예시
          데이터 · 표지는 연출용 생성 이미지.
        </p>
        <MobileDraftNav />
        <ul className={s.notesList}>
          <li>
            <strong>상단 바</strong> 탭 첫 화면은 큰 제목, 하위 화면은 “← 제목”. 브랜드 바와 경로
            표시는 없앤다.
          </li>
          <li>
            <strong>목록 행</strong> 정보는 아이콘 + 한 줄 + 보조 줄의 행으로, 섹션은 묶음 카드로.
          </li>
          <li>
            <strong>아래 시트</strong> 신청 확인 · 필터는 화면 이동 대신 아래 시트. 지금 규칙대로
            120ms 불투명도로만 나타난다.
          </li>
          <li>
            <strong>위 탭</strong> 긴 관리 화면은 개요 · 명단 · 공지 · 장부로 나눈다.
          </li>
        </ul>
      </aside>
      <div className={s.phone}>
        <div className={s.screen} id="app-screen">
          {children}
        </div>
      </div>
    </main>
  );
}
