"use client";

// Client component: the learner sticks "keep this" notes on the sentences that were fine, and the
// example follow-up memo is written from the notes. Which sentences are kept lives in the visit's
// lesson state. Only what the learner writes themselves goes to the practice record and the
// clipboard: the example memo is about the example answer, not theirs. "Copied" is momentary.
import { useState } from "react";
import { Nanum_Pen_Script } from "next/font/google";
import { workbookLessonId } from "@/lib/workbook-course";
import { EXAMPLE_ANSWER } from "./WorkbookAnswerCheck";
import { emptyPractice } from "./WorkbookPracticeLesson";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookCopyFallback } from "./WorkbookCopyFallback";
import styles from "./WorkbookAskAgain.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** What to change, found on the previous screen. These notes are already on the paper. */
const CHANGE = [
  "두 번째 문장의 경력 이야기는 내가 말하지 않은 내용이니 빼줘.",
  "마지막 문장은 편하고 친근한 말투로 바꿔줘.",
] as const;
const ORDINAL = ["첫 번째", "두 번째", "세 번째", "네 번째"] as const;

/** The "leave these alone" line for the sentences the learner marked, or "" when none. */
function keepLine(kept: readonly number[]) {
  if (kept.length === 0) return "";
  const names = [...kept].sort().map((index) => ORDINAL[index]);
  return `${names.join(", ")} 문장은 그대로 둬.`;
}

/**
 * 1-5 screen 5: ask again by pointing at what to change and what to keep. Continues with the
 * example answer from the previous screen. Nothing is graded and nothing blocks the recap.
 */
export function WorkbookAskAgain() {
  const { practice, setPractice } = useWorkbookProgress();
  const [kept, setKept] = useWorkbookLessonState<number[]>("ai-5-again-kept", []);
  const [change, setChange] = useWorkbookLessonState("ai-5-again-change", "");
  const [leave, setLeave] = useWorkbookLessonState("ai-5-again-leave", "");
  const [own, setOwn] = useWorkbookLessonState("ai-5-again-own", "");
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const sent = practice[workbookLessonId.firstRequest]?.mode === "computer";
  const keep = keepLine(kept);
  const mine = [change, leave]
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  function save(revision: string) {
    setPractice((previous) => ({
      ...previous,
      [workbookLessonId.firstRequest]: {
        ...(previous[workbookLessonId.firstRequest] ?? emptyPractice()),
        revision,
      },
    }));
  }
  function toggle(index: number) {
    setKept(kept.includes(index) ? kept.filter((item) => item !== index) : [...kept, index]);
  }
  function writeMine(next: { change?: string; leave?: string }) {
    const nextChange = next.change ?? change;
    const nextLeave = next.leave ?? leave;
    setChange(nextChange);
    setLeave(nextLeave);
    setCopied(null);
    save(
      [nextChange, nextLeave]
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n"),
    );
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(mine);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div data-lesson-wide className={styles.again}>
      <h2 id="lesson-screen-title" className={styles.title}>
        고칠 곳만 집어서 다시 부탁해요
      </h2>
      <div className={styles.lead}>
        <p>
          고칠 곳을 찾았으니 다시 부탁할 차례입니다. “다시 써줘”라고만 하면 AI가 처음부터 다시
          쓰면서 잘된 문장까지 바뀔 수 있어요. 그래서 <strong>바꿀 것</strong>과{" "}
          <strong>그대로 둘 것</strong>을 함께 말합니다.
        </p>
      </div>

      <div className={styles.desk}>
        <section className={styles.paper} aria-label="예시 답">
          <header className={styles.paperHead}>
            <strong>AI가 돌려준 답 (연습)</strong>
            <span>잘된 문장을 눌러 ‘그대로 둘 것’을 붙여 볼까요?</span>
          </header>
          <ol className={styles.sentences}>
            {EXAMPLE_ANSWER.map((sentence, index) =>
              "flaw" in sentence ? (
                <li key={sentence.text}>
                  <span className={styles.flawed}>{sentence.text}</span>
                  <span className={`${styles.note} ${hand.className}`} data-kind="change">
                    바꿀 것
                  </span>
                </li>
              ) : (
                <li key={sentence.text}>
                  <button
                    type="button"
                    className={styles.sentence}
                    aria-pressed={kept.includes(index)}
                    onClick={() => toggle(index)}
                  >
                    {sentence.text}
                  </button>
                  {kept.includes(index) && (
                    <span className={`${styles.note} ${hand.className}`} data-kind="keep">
                      그대로 둘 것
                    </span>
                  )}
                </li>
              ),
            )}
          </ol>
          <p className={styles.added} role="status">
            {keep && "↓ 아래 ‘고쳐 달라는 메모’에 그대로 둘 문장이 더해졌어요."}
          </p>
          <p className={styles.why}>
            바꿀 곳만 집어 말하면 AI가 새로 쓰는 양도 줄어서, 사용량도 아낄 수 있습니다.
          </p>
        </section>

        <div className={styles.side}>
          <section className={styles.memo} aria-live="polite" aria-label="고쳐 달라는 메모">
            <header className={hand.className}>
              <s>다시 써줘</s>
              <span>고쳐 달라는 메모 (연습)</span>
            </header>
            <ul>
              {CHANGE.map((line) => (
                <li key={line} data-kind="change">
                  {line}
                </li>
              ))}
              {keep ? (
                <li key={keep} data-kind="keep" className={styles.written}>
                  {keep}
                </li>
              ) : (
                <li className={styles.blank}>
                  그대로 둘 문장이 아직 없어요. 적지 않으면 AI가 그 문장도 바꿀 수 있어요.
                </li>
              )}
            </ul>
          </section>
          {sent ? (
            <section className={styles.mine} aria-label="내 답에 다시 부탁하기">
              <p className={styles.mineLead}>
                내가 받은 답에는 이렇게 써 봐요. <small>안 적어도 돼요</small>
              </p>
              <label>
                <span data-kind="change">바꿀 것</span>
                <input
                  type="text"
                  value={change}
                  placeholder="예: 둘째 문장을 더 짧게 줄여줘."
                  autoComplete="off"
                  onChange={(event) => writeMine({ change: event.target.value })}
                />
              </label>
              <label>
                <span data-kind="keep">그대로 둘 것</span>
                <input
                  type="text"
                  value={leave}
                  placeholder="예: 나머지 문장은 그대로 둬."
                  autoComplete="off"
                  onChange={(event) => writeMine({ leave: event.target.value })}
                />
              </label>
              <div className={styles.copyRow}>
                <button type="button" className={styles.copy} disabled={!mine} onClick={copy}>
                  내 수정 요청 복사하기
                </button>
                <p className={styles.copied} role="status">
                  {copied === "done" && "복사했어요. 같은 대화에 붙여 넣고 보내요."}
                </p>
                {copied === "failed" && <WorkbookCopyFallback text={mine} />}
              </div>
            </section>
          ) : (
            <label className={styles.single}>
              <span>
                나라면 뭐라고 다시 부탁할지 한 줄로 적어 볼까요? <small>안 적어도 돼요</small>
              </span>
              <input
                type="text"
                value={own}
                placeholder="예: 둘째 문장만 더 짧게 줄여줘. 나머지는 그대로 둬."
                autoComplete="off"
                onChange={(event) => {
                  setOwn(event.target.value);
                  save(event.target.value.trim());
                }}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
