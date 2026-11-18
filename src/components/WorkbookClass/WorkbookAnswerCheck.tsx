"use client";

// Client component: the learner checks an example answer against the memo with a red pen by
// tapping sentences. Which spots they found is kept in the visit's lesson state, and the one-line
// note about their own answer is kept in the practice record (map and unit summary read it).
import { useState } from "react";
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { workbookLessonId } from "@/lib/workbook-course";
import { emptyPractice } from "./WorkbookPracticeLesson";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookAnswerCheck.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** What the example memo said. The answer below is checked against these, nothing else. */
const MEMO = [
  "커피와 산책을 좋아하는 직장인",
  "세 문장",
  "편하고 친근한 말투",
  "말하지 않은 내용은 지어내지 않기",
] as const;

/**
 * A hand-written example answer (not real AI output). It has four sentences where the memo asked
 * for three (marked for the learner as the demonstration), and two sentences to find: `flaw` is
 * the red-pen note shown once the learner taps it.
 */
export const EXAMPLE_ANSWER = [
  { text: "안녕하세요, 커피와 산책을 좋아하는 직장인이에요." },
  { text: "5년 동안 마케팅 일을 하며 여러 상을 받았어요.", flaw: "메모에 없던 경력이에요" },
  { text: "커피 한 잔 들고 천천히 걷는 시간을 좋아해요." },
  { text: "귀하의 방문을 진심으로 환영하는 바입니다.", flaw: "친근한 말투가 아니에요" },
] as const;

/**
 * For learners who sent their own memo: the same four tags as a checklist for their real answer.
 * Nothing is checked by the workbook; the ticks are the learner's own reading.
 */
const MINE = [
  ["무엇을", "나를 소개하는 글인가요?"],
  ["어디에 쓸지", "페이지 맨 위에 어울리나요?"],
  ["조건", "세 문장, 친근한 말투인가요?"],
  ["하지 말 것", "지어낸 내용은 없나요?"],
] as const;

const FLAWS = EXAMPLE_ANSWER.flatMap((sentence, index) => ("flaw" in sentence ? [index] : []));

/**
 * 1-5 screen 4: read the answer against the memo instead of trusting it. One spot (length) is
 * already marked as a demonstration; the learner finds the other two. Nothing is graded and
 * nothing blocks the next screen.
 */
export function WorkbookAnswerCheck() {
  const { practice, setPractice } = useWorkbookProgress();
  const [found, setFound] = useWorkbookLessonState<number[]>("ai-5-check-found", []);
  // 메모와 맞는 문장을 눌렀을 때의 짧은 안내. 화면을 떠나면 사라져도 된다.
  const [fine, setFine] = useState<number | null>(null);
  const [ticks, setTicks] = useWorkbookLessonState<boolean[]>("ai-5-check-mine", [
    false,
    false,
    false,
    false,
  ]);
  const record = practice[workbookLessonId.firstRequest] ?? emptyPractice();
  const example = record.mode !== "computer";
  const done = FLAWS.every((index) => found.includes(index));

  function tap(index: number) {
    if (FLAWS.includes(index)) {
      setFine(null);
      if (!found.includes(index)) setFound([...found, index]);
    } else {
      setFine(index);
    }
  }
  function note(observation: string) {
    setPractice((previous) => ({
      ...previous,
      [workbookLessonId.firstRequest]: {
        ...(previous[workbookLessonId.firstRequest] ?? emptyPractice()),
        observation,
      },
    }));
  }

  return (
    <div data-lesson-wide className={styles.check}>
      <h2 id="lesson-screen-title" className={styles.title}>
        받은 답을 메모와 맞춰 봐요
      </h2>
      <div className={styles.lead}>
        <p>
          AI의 답은 그럴듯해 보여도 메모와 다를 수 있습니다. 그래서 받은 답은 메모 옆에 놓고
          확인해요. 예시 답 한 장으로 연습해 볼까요?
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.side}>
          <div className={styles.memoRow}>
            <section className={styles.memo} aria-label="예시 메모에 적은 것">
              <h3 className={hand.className}>메모에 적은 것</h3>
              <ul>
                {MEMO.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
            {/* 카피바라 리액션: 답을 받아 들고 땀 → 세 곳을 다 찾으면 엄지. 새 그림 없이 1-2의 컷을 쓴다. */}
            <Image
              key={done ? "thumb" : "puzzled"}
              className={styles.capy}
              src={
                done
                  ? "/images/workbook/lesson-1-2/capy-thumb.png"
                  : "/images/workbook/lesson-1-2/capy-puzzled.png"
              }
              alt=""
              aria-hidden="true"
              width={done ? 295 : 267}
              height={480}
            />
          </div>
          <label className={styles.mine}>
            <span>
              {example ? "예시 답을 보고 알게 된 것을" : "내가 받은 답은 어땠는지"} 한 줄로 적어
              볼까요? <small>안 적어도 돼요</small>
            </span>
            <input
              type="text"
              value={record.observation}
              placeholder={
                example
                  ? "예: 그럴듯해도 지어낸 내용이 있을 수 있다"
                  : "예: 세 문장은 지켰는데 취미를 하나 지어냈다"
              }
              autoComplete="off"
              onChange={(event) => note(event.target.value)}
            />
          </label>
        </div>

        <div className={styles.right}>
          <section className={styles.paper} aria-label="예시 답">
            <header className={styles.paperHead}>
              <strong>AI가 돌려준 답 (연습)</strong>
              <span className={`${styles.pen} ${hand.className}`}>
                네 문장이에요. 세 문장으로 부탁했는데!
              </span>
            </header>
            <ol className={styles.sentences}>
              {EXAMPLE_ANSWER.map((sentence, index) => {
                const marked = found.includes(index);
                return (
                  <li key={sentence.text}>
                    <button
                      type="button"
                      className={styles.sentence}
                      aria-pressed={marked}
                      onClick={() => tap(index)}
                    >
                      {sentence.text}
                    </button>
                    {marked && "flaw" in sentence && (
                      <span className={`${styles.pen} ${hand.className}`}>{sentence.flaw}</span>
                    )}
                    {fine === index && (
                      <span className={styles.fine}>이 문장은 메모와 맞아요.</span>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className={styles.status} aria-live="polite">
              {done ? (
                <>
                  세 곳을 다 찾았어요. 길이, 지어낸 내용, 말투 모두 <strong>메모에 적은 것</strong>
                  과 맞춰 봐서 찾은 거예요.
                </>
              ) : (
                <>
                  길이는 먼저 표시해 뒀어요. 메모와 다른 문장이 <strong>두 개</strong> 더 있습니다.
                  문장을 눌러 표시해 보세요. (
                  {FLAWS.filter((index) => found.includes(index)).length} / {FLAWS.length})
                </>
              )}
            </p>
            {!done && (
              <button type="button" className={styles.reveal} onClick={() => setFound([...FLAWS])}>
                표시 한꺼번에 보기
              </button>
            )}
          </section>
          {!example && (
            <fieldset className={styles.mineChecks}>
              <legend>내 답도 이 네 가지로 맞춰 봐요</legend>
              {MINE.map(([tag, question], index) => (
                <label key={tag}>
                  <input
                    type="checkbox"
                    checked={ticks[index]}
                    onChange={() =>
                      setTicks(ticks.map((value, at) => (at === index ? !value : value)))
                    }
                  />
                  <strong>{tag}</strong> {question}
                </label>
              ))}
            </fieldset>
          )}
        </div>
      </div>
    </div>
  );
}
