"use client";

// Client component: three readers look at the same first page from 1-6. Picking one puts the
// capybara (as that reader) beside the page, puzzled, and marks the three things they look for as
// "아직 없음". "다 채우면" shows the same page with those slots filled and the reader's button —
// the capybara gives a thumbs up. The pick is the plan's "읽을 사람" (written by the parent).
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { planButtons, planReaders, type PlanReader } from "@/lib/workbook-plan-readers";
import { WorkbookMyPage, type MyPageSection } from "./WorkbookMyPage";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
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
  const [view, setView] = useWorkbookLessonState<"now" | "filled">("plan-readers-view", "now");
  const filled = !!picked && view === "filled";
  const button = picked ? planButtons.find((item) => item.id === picked.button) : undefined;
  // 고르기 전에는 빈 자리 세 칸, 고르면 그 사람이 찾는 것 세 가지가 "아직 없음"으로, 채운 모습에서는 칸이 채워진다.
  const sections: MyPageSection[] = picked
    ? picked.cards.slice(0, 3).map((label) => ({ label, state: filled ? "filled" : "wanted" }))
    : [0, 1, 2].map(() => ({ label: "", state: "empty" }));
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
                onClick={() => {
                  onPick(reader);
                  setView("now");
                }}
              >
                <span className={hand.className}>{reader.tag}</span>
                {reader.id === purposeId && <small>처음에 고른 목적과 가까운 사람</small>}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.stage}>
          <div className={styles.pageColumn}>
            <WorkbookMyPage
              title={pageTitle}
              intro={pageIntro}
              sections={sections}
              button={filled ? button?.label : undefined}
            />
            <div className={styles.under}>
              <span>
                {filled
                  ? "2단원을 마치면 내 페이지가 이런 모습이 돼요"
                  : "1단원에서 만든 내 첫 화면 · index.html"}
              </span>
              {picked && (
                <button
                  type="button"
                  className={styles.toggle}
                  aria-pressed={filled}
                  onClick={() => setView(filled ? "now" : "filled")}
                >
                  {filled ? "← 지금 페이지로 돌아가기" : "다 채우면 어떤 모습일까요? →"}
                </button>
              )}
            </div>
          </div>
          {picked ? (
            <div key={`${picked.id}-${view}`} className={styles.capy}>
              <p className={`${styles.bubble} ${hand.className}`} aria-live="polite">
                {filled
                  ? `${picked.tag}: “이제 찾던 게 한눈에 보여요!”`
                  : `${picked.tag}: “${picked.looksFor} 알고 싶은데, 이 페이지엔 아직 그 내용이 없네요.”`}
              </p>
              <Image
                src={
                  filled
                    ? "/images/workbook/lesson-1-2/capy-thumb.png"
                    : "/images/workbook/lesson-1-2/capy-puzzled.png"
                }
                alt=""
                aria-hidden="true"
                width={filled ? 295 : 267}
                height={480}
              />
            </div>
          ) : (
            <p className={styles.notePlaceholder}>
              사람을 고르면 그 사람이 이 페이지에서 무엇을 찾는지 보여 드려요.
            </p>
          )}
        </div>
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
