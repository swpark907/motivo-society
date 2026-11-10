import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CapyLoading } from "@/components/CapyLoading/CapyLoading";
import s from "./demo.module.scss";

export const metadata: Metadata = { title: "공용 로딩 화면", robots: { index: false } };

/** 공용 로딩 화면 미리보기(2026-11-10). 개발 환경에서만. 실제 화면은 src/components/CapyLoading. */
export default function LoadingDraftPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className={`paper ${s.page}`}>
      <div className={s.inner}>
        <header className={s.head}>
          <p className="label">LOADING</p>
          <h1>공용 로딩 화면</h1>
          <p>
            화면을 옮길 때 서버가 그리는 동안 보인다. 0.2초 안에 끝나면 나타나지 않는다. 산책 → 차 →
            비행기가 4초씩 차례로 지나간다. 모션 줄이기를 켜면 정지 화면.
          </p>
        </header>
        <div className={s.grid}>
          <section className={s.cell} aria-label="화면 전체(순환)">
            <p className={s.cap}>화면 전체 · 세 장면 순환</p>
            <CapyLoading />
          </section>
          <section className={`${s.cell} ${s.dark}`} aria-label="검정 바탕">
            <p className={s.cap}>검정 바탕</p>
            <CapyLoading tone="dark" />
          </section>
          <section className={s.cell} aria-label="작게(누른 카드 위)">
            <p className={s.cap}>작게 · 누른 카드 위</p>
            <CapyLoading compact />
          </section>
          <section className={s.cell} aria-label="산책만">
            <p className={s.cap}>산책</p>
            <CapyLoading scene="walk" />
          </section>
          <section className={s.cell} aria-label="차만">
            <p className={s.cap}>차</p>
            <CapyLoading scene="car" />
          </section>
          <section className={s.cell} aria-label="비행기만">
            <p className={s.cap}>비행기</p>
            <CapyLoading scene="plane" />
          </section>
        </div>
      </div>
    </main>
  );
}
