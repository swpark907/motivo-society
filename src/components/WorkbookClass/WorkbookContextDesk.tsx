"use client";

// Client component: the learner puts conversation slips on the desk one by one; when the desk is
// full the oldest slip falls off. The count is kept in the visit's lesson state.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookContextDesk.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** What the capybara asked for, in order. The first one is the slip that falls off. */
const SLIPS = [
  "제목은 주황색으로 해줘",
  "소개 글을 써줘",
  "사진 자리를 만들어줘",
  "메뉴를 추가해줘",
  "글자를 조금 키워줘",
] as const;
/** How many slips fit on the desk. */
const DESK = 4;

/**
 * 1-3 screen 2 (the lesson's big scene): the context window as a desk.
 * "The AI forgets" is only a picture of the idea: some services summarize earlier turns instead,
 * so the text says the AI can miss or only vaguely keep what fell off, not that it always does.
 */
export function WorkbookContextDesk() {
  const [count, setCount] = useWorkbookLessonState("ai-2-desk-slips", 0);
  const full = count >= DESK;
  const fallen = count > DESK;

  return (
    <div data-lesson-wide className={styles.desk}>
      <h2 id="lesson-screen-title" className={styles.title}>
        한 번에 볼 수 있는 범위가 있어요
      </h2>

      <div className={styles.layout}>
        <div className={`${styles.scene} ${hand.className}`}>
          <p className={styles.sceneLabel}>AI의 책상</p>
          <ol className={styles.top} aria-label="책상 위의 쪽지">
            {SLIPS.slice(0, count).map((slip, index) => (
              <li
                key={slip}
                className={styles.slip}
                data-fallen={(fallen && index === 0) || undefined}
                data-new={index === count - 1 || undefined}
              >
                {slip}
              </li>
            ))}
            {count === 0 && <li className={styles.emptySlot}>아직 비어 있어요</li>}
          </ol>
          <span className={styles.edge} aria-hidden="true" />
          <Image
            className={styles.capy}
            src={
              fallen
                ? "/images/workbook/lesson-1-2/capy-puzzled.png"
                : "/images/workbook/lesson-1-2/capy-ask.png"
            }
            alt=""
            width={fallen ? 267 : 306}
            height={480}
          />
          <p className={styles.status} aria-live="polite">
            {fallen
              ? "가장 오래된 쪽지가 책상에서 밀려났어요"
              : full
                ? "책상이 가득 찼어요"
                : `쪽지 ${count}장 · ${DESK}장까지 올릴 수 있어요`}
          </p>
        </div>

        <div className={styles.side}>
          <p>
            AI가 한 번에 볼 수 있는 글의 양을 <strong>컨텍스트</strong>라고 합니다. 책상 크기라고
            생각하면 쉬워요.
          </p>
          <p>대화가 아주 길어지면 앞에서 나눈 내용을 놓치거나 흐릿하게 기억할 수 있어요.</p>

          <div className={styles.action}>
            {fallen ? (
              <>
                <p className={styles.answer}>
                  <span>카피바라</span> 제목 색, 기억하지?
                </p>
                <p className={styles.answer} data-ai>
                  <span>AI</span> 제목 색 이야기는 지금 책상 위에 없어요.
                </p>
                <button type="button" className={styles.reset} onClick={() => setCount(0)}>
                  처음부터 다시
                </button>
              </>
            ) : (
              <>
                <p className={styles.invite}>
                  {count === 0
                    ? "카피바라의 부탁을 책상에 한 장씩 올려 볼까요?"
                    : full
                      ? "한 장을 더 올리면 어떻게 될까요?"
                      : "계속 올려 보세요."}
                </p>
                <button
                  type="button"
                  className={styles.add}
                  onClick={() => setCount((previous) => Math.min(previous + 1, SLIPS.length))}
                >
                  쪽지 올리기
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
