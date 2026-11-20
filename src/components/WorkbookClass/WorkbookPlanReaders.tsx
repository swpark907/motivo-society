"use client";

// Client component: three readers look at the same first page from 1-6. Picking one runs a
// highlighter over the page and a margin note says what that reader is looking for and that the
// page doesn't have it yet. The pick is the plan's "읽을 사람" (written by the parent).
import { Nanum_Pen_Script } from "next/font/google";
import { planReaders, type PlanReader } from "@/lib/workbook-plan-readers";
import styles from "./WorkbookPlanReaders.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** 2-1 screen 1: same page, different eyes. Nothing to type. */
export function WorkbookPlanReaders({
  pageTitle,
  pageIntro,
  picked,
  purposeId,
  onPick,
}: {
  pageTitle: string;
  pageIntro: string;
  picked: PlanReader | null;
  purposeId: string | null;
  onPick: (reader: PlanReader) => void;
}) {
  return (
    <div data-lesson-wide className={styles.readers}>
      <h2 id="lesson-screen-title" className={styles.title}>
        이 페이지는 누가 보게 될까요
      </h2>
      <div className={styles.lead}>
        <p>
          1단원에서 만든 첫 화면을 다시 가져와 봤어요. 이 페이지를 보는 사람에 따라{" "}
          <strong>찾는 것</strong>이 다릅니다. 열어 볼 사람을 한 명 골라 볼까요?
        </p>
      </div>

      <div className={styles.scene}>
        <ul className={styles.tags} aria-label="열어 볼 사람">
          {planReaders.map((reader) => (
            <li key={reader.id}>
              <button
                type="button"
                className={styles.tag}
                aria-pressed={picked?.id === reader.id}
                onClick={() => onPick(reader)}
              >
                <span className={hand.className}>{reader.tag}</span>
                {reader.id === purposeId && <small>처음에 고른 목적과 가까운 사람</small>}
              </button>
            </li>
          ))}
        </ul>

        <figure className={styles.page} data-picked={picked?.id ?? "none"}>
          <div className={styles.sheet}>
            <strong className={styles.pageTitle}>{pageTitle}</strong>
            <div className={styles.introLine}>
              {/* 형광펜은 고를 때마다 다시 한 번 칠해진다(key로 다시 그린다). */}
              {picked && <i key={picked.id} className={styles.marker} aria-hidden="true" />}
              {pageIntro ? (
                <p>{pageIntro}</p>
              ) : (
                <span className={styles.lines} aria-label="소개 글 자리">
                  <i />
                  <i />
                </span>
              )}
            </div>
            <div className={styles.empty} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>
          {picked ? (
            <p key={picked.id} className={`${styles.note} ${hand.className}`} aria-live="polite">
              {picked.tag}: “{picked.looksFor} 알고 싶은데, 이 페이지엔 아직 그 내용이 없네요.”
            </p>
          ) : (
            <p className={styles.notePlaceholder}>
              사람을 고르면 그 사람이 이 페이지에서 무엇을 찾는지 보여 드려요.
            </p>
          )}
          <figcaption>1단원에서 만든 내 첫 화면 · index.html</figcaption>
        </figure>
      </div>

      {picked && (
        <p className={styles.closing}>
          지금 페이지에는 제목과 소개 글뿐이라, 페이지의 점선 칸이 비어 있어요. 읽을 사람이 정해지면
          그 빈칸에 <strong>무엇을 채워야 할지</strong>가 보입니다. 이번 단원에서는 이 홈페이지를
          누가 방문할지에 대해서 생각해 보고, 그 목적에 맞게 여러 시각적 요소들을 구성하는 것을
          기획해 볼게요.
        </p>
      )}
    </div>
  );
}
