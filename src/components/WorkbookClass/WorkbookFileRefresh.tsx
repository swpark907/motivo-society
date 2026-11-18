"use client";

// Client component: a practice browser. The learner sends a pretend fix (the file changes but the
// page does not), then presses refresh and the page catches up. The practice step lives in the
// visit's lesson state; the fix they plan for their own file goes to the practice record.
import { useState } from "react";
import { Nanum_Pen_Script } from "next/font/google";
import { WorkbookDoneStamp } from "./WorkbookDoneStamp";
import { useFirstFilePractice } from "./useFirstFilePractice";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookFileRefresh.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

const OLD_TITLE = "내 소개";
const NEW_TITLE = "나를 소개합니다";

/**
 * 1-6 screen 4 (the lesson's big scene): the browser shows what it read earlier until it is told
 * to read the file again. 0 = before the fix, 1 = file fixed but page stale, 2 = refreshed.
 * Everything here is a practice window inside the workbook; no real file or AI is involved.
 */
export function WorkbookFileRefresh() {
  const { record, save } = useFirstFilePractice();
  const [stage, setStage] = useWorkbookLessonState("ai-6-refresh-stage", 0);
  const fresh = stage === 2;
  // 메모를 보내기 전에 새로고침을 누르면 "아직 바뀐 게 없다"고 알려 준다(잠깐 보이는 안내).
  const [early, setEarly] = useState(false);

  return (
    <div data-lesson-wide className={styles.refresh}>
      <h2 id="lesson-screen-title" className={styles.title}>
        한 곳만 고치고 새로고침해요
      </h2>
      <div className={styles.lead}>
        <p>
          고칠 때도 지난 수업처럼 고칠 곳만 집어서 부탁합니다. 그런데 파일을 고쳐도 브라우저 화면은
          저절로 바뀌지 않아요. 아래 연습 창에서 먼저 해 볼까요?
        </p>
      </div>

      <div className={styles.desk}>
        <section className={styles.browser} aria-label="연습용 브라우저 창">
          <div className={styles.bar}>
            <button
              type="button"
              className={styles.reload}
              aria-label="새로고침"
              data-call={stage === 1 || undefined}
              onClick={() => {
                if (stage === 1) setStage(2);
                else setEarly(stage === 0);
              }}
            >
              ↻
            </button>
            <span>index.html</span>
          </div>
          <div className={styles.page} aria-live="polite">
            <strong key={String(fresh)}>{fresh ? NEW_TITLE : OLD_TITLE}</strong>
            <p>안녕하세요, 커피와 산책을 좋아하는 직장인이에요.</p>
            <p>커피 한 잔 들고 천천히 걷는 시간을 좋아해요.</p>
            <p>들러 주셔서 반가워요.</p>
            {stage === 1 && (
              <span className={`${styles.huh} ${hand.className}`}>어? 제목이 그대로네</span>
            )}
          </div>
        </section>

        <div className={styles.side}>
          <figure className={styles.memo}>
            <figcaption>고쳐 달라는 메모 (연습)</figcaption>
            <blockquote>제목을 “{NEW_TITLE}”로 바꿔줘. 다른 곳은 그대로 둬.</blockquote>
          </figure>
          <div className={styles.act} aria-live="polite">
            {stage === 0 && (
              <>
                <button
                  type="button"
                  className={styles.go}
                  onClick={() => {
                    setEarly(false);
                    setStage(1);
                  }}
                >
                  메모 보내기 (연습)
                </button>
                {early && <p>아직 파일이 바뀌지 않았어요. 먼저 메모를 보내 볼까요?</p>}
              </>
            )}
            {stage === 1 && (
              <p>
                AI가 파일을 고쳤어요. 그런데 화면은 그대로죠. 브라우저 창의{" "}
                <strong>↻ 새로고침</strong>을 눌러 보세요.
              </p>
            )}
            {fresh && (
              <>
                <p>
                  새로고침은 <strong>파일을 다시 읽어 오라</strong>는 뜻이에요. 그래서 고친 뒤에는
                  꼭 새로고침합니다. (Windows는 F5, Mac은 ⌘R)
                </p>
                <button type="button" className={styles.again} onClick={() => setStage(0)}>
                  처음부터 다시
                </button>
              </>
            )}
          </div>
          {record.mode === "example" ? (
            <p className={styles.later}>
              컴퓨터가 준비되면 내 파일에서도 한 곳을 골라 이렇게 고쳐 보고 새로고침해요.
            </p>
          ) : (
            <>
              <label className={styles.mine}>
                <span>
                  내 파일에서는 어디를 고쳐 볼까요? <small>안 적어도 돼요</small>
                </span>
                <input
                  type="text"
                  value={record.revision}
                  placeholder="예: 제목을 내 이름으로 바꿔줘. 다른 곳은 그대로 둬."
                  autoComplete="off"
                  onChange={(event) => save({ revision: event.target.value })}
                />
                <small className={styles.how}>
                  적은 글을 Claude 앱의 같은 대화에 보내고, 브라우저에서 새로고침해요.
                </small>
              </label>
              <WorkbookDoneStamp index={2} ask="고친 화면을 봤으면 눌러서 도장을 찍어요" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
