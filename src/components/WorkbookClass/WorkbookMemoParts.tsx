"use client";

// Client component: one memo with four name tags. A button swaps what is written on the lines
// (the lunch errand from the previous screen, then a request to the AI) while the tags stay.
// Which memo is showing is kept in the visit's lesson state.
import { Nanum_Pen_Script } from "next/font/google";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookMemoParts.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** The four things to write on a memo. The tags never change; only the lines under them do. */
export const MEMO_PARTS = [
  {
    label: "무엇을",
    hint: "해 줬으면 하는 일과 필요한 정보",
    helper: "김밥 두 줄 사다 줘.",
    ai: "나를 소개하는 글을 써줘. 나는 커피와 산책을 좋아하는 직장인이야.",
  },
  {
    label: "어디에 쓸지",
    hint: "결과가 쓰일 자리",
    helper: "사무실에서 둘이 먹을 거야.",
    ai: "내 소개 페이지 맨 위에 넣을 글이야.",
  },
  {
    label: "조건",
    hint: "지켜야 할 기준",
    helper: "만 원 안에서 골라 줘.",
    ai: "세 문장, 편하고 친근한 말투로 써줘.",
  },
  {
    label: "하지 말 것",
    hint: "하지 않았으면 하는 것",
    helper: "매운 건 빼 줘.",
    ai: "내가 말하지 않은 내용은 지어내지 마. 파일은 만들지 말고 답으로만 보여줘.",
  },
] as const;

type To = "helper" | "ai";

/**
 * 1-5 screen 2: the four things to write on a memo. The same four tags are shown twice (errand,
 * then AI request) so the learner remembers the tags, not the example text. Nothing to fill in;
 * writing their own memo happens on the next screen.
 */
export function WorkbookMemoParts() {
  const [to, setTo] = useWorkbookLessonState<To>("ai-5-memo-to", "helper");
  const ai = to === "ai";

  return (
    <div data-lesson-wide className={styles.parts}>
      <h2 id="lesson-screen-title" className={styles.title}>
        작업 메모에 적을 네 가지
      </h2>
      <div className={styles.lead}>
        <p>
          짐작할 틈을 줄이려면 메모에 네 가지를 적습니다. 아까 그 점심 메모에 네 가지를 채우면
          이렇게 돼요.
        </p>
      </div>

      <div className={styles.desk}>
        <section className={styles.memo} aria-live="polite" aria-label="작업 메모">
          <header className={styles.head}>
            <span className={`${styles.to} ${hand.className}`}>{ai ? "AI에게" : "조수에게"}</span>
            <span className={styles.switch} role="group" aria-label="누구에게 건넬 메모인지">
              <button type="button" aria-pressed={!ai} onClick={() => setTo("helper")}>
                조수에게
              </button>
              <button type="button" aria-pressed={ai} onClick={() => setTo("ai")}>
                AI에게
              </button>
            </span>
          </header>
          <ol className={styles.rows}>
            {MEMO_PARTS.map((part, index) => (
              <li key={part.label} className={styles.row}>
                <div className={styles.tag}>
                  <span className={styles.no}>{index + 1}</span>
                  <strong>{part.label}</strong>
                  <small>{part.hint}</small>
                </div>
                <p key={to} className={styles.line}>
                  {part[to]}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className={styles.side}>
          {ai ? (
            <>
              <p>
                이름표 네 개는 그대로이고 적힌 글만 바뀌었어요. 이 네 가지를 적은 요청 글을{" "}
                <strong>프롬프트</strong>라고 합니다.
              </p>
              <p>앞으로 AI에게 요청을 쓸 때마다 이 네 줄을 떠올려 보세요.</p>
            </>
          ) : (
            <>
              <p>네 줄이 다 있으니 조수가 짐작할 것이 거의 없어요.</p>
              <p>
                <strong>이 틀 그대로 AI에게 건넬 메모도 쓸 수 있습니다.</strong> 메모 위의{" "}
                <strong>AI에게</strong>를 눌러 바꿔 볼까요?
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
