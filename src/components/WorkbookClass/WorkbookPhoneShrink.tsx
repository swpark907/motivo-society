"use client";

// Client component: 3-1 screen 1. The learner's page as it looks on a computer, squeezed into a phone
// the way a page that doesn't adapt would be: first shrunk whole (too small to read), then zoomed in
// (now it runs off the side and has to be pushed sideways — the phone screen really scrolls). The
// capybara, holding the phone, reacts to each. Framed as "if the phone just shrank it", not as a claim
// about the learner's own file.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookMyPage, myPageOrSample } from "./WorkbookMyPage";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookPhoneShrink.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** 3-1 screen 1: a computer page squeezed into a phone. */
export function WorkbookPhoneShrink({ project }: { project: ProjectRecord }) {
  const [zoomed, setZoomed] = useWorkbookLessonState("responsive-phone-zoomed", false);
  const [seen, setSeen] = useWorkbookLessonState("responsive-phone-seen", false);
  const page = myPageOrSample(project, 3);
  return (
    <div data-lesson-wide className={styles.shrink}>
      <h2 id="lesson-screen-title" className={styles.title}>
        휴대폰으로 열어 보면
      </h2>
      <div className={styles.lead}>
        <p>
          2단원에서 만든 내 페이지는 지금까지 넓은 컴퓨터 화면에서 봤어요. 만약 이 화면을 휴대폰이{" "}
          <strong>그대로 작게 줄여서</strong> 보여 준다면 어떻게 될까요?
        </p>
      </div>

      <div className={styles.stage}>
        <figure className={styles.phone} aria-label="휴대폰에 그대로 줄여 넣은 내 페이지">
          <div className={styles.screen} data-zoomed={zoomed} tabIndex={zoomed ? 0 : -1}>
            <div className={styles.desk}>
              <WorkbookMyPage {...page} layout={page.layout ?? "two"} />
            </div>
          </div>
          {zoomed && (
            <figcaption className={styles.swipe} aria-hidden="true">
              ← 옆으로 밀어야 보여요 →
            </figcaption>
          )}
        </figure>

        <div className={styles.side}>
          <div key={String(zoomed)} className={styles.capy}>
            <p className={`${styles.bubble} ${hand.className}`} aria-live="polite">
              {zoomed
                ? "이번엔 글씨는 보이는데, 옆이 잘려서 계속 옆으로 밀어야 해요."
                : "글씨가 너무 작아서 하나도 안 읽혀요."}
            </p>
            <Image
              src="/images/workbook/lesson-1-2/capy-puzzled.png"
              alt=""
              aria-hidden="true"
              width={267}
              height={480}
            />
          </div>
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={zoomed}
            onClick={() => {
              setZoomed(!zoomed);
              setSeen(true);
            }}
          >
            {zoomed ? "다시 작게 줄여 보기" : "손가락으로 크게 키워 보기"}
          </button>
          {seen && (
            <p className={styles.closing}>
              줄이면 읽을 수 없고, 키우면 옆으로 밀어야 해요. 그래서 휴대폰에서는 페이지가{" "}
              <strong>화면 크기에 맞게 다시 놓여야</strong> 해요. 이번 수업에서는 화면 크기가 다른
              기기들을 살펴보고, 페이지가 어떻게 맞춰지는지 알아볼게요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
