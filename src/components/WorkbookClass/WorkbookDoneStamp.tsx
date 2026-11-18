"use client";

// Client component: a stamp the learner presses to say they did a step on their own computer.
import { FIRST_FILE_CHECKS, useFirstFilePractice } from "./useFirstFilePractice";
import styles from "./WorkbookDoneStamp.module.scss";

/** One of the three "첫 코드 만들기" stamps. `ask` is what the button says before it is pressed. */
export function WorkbookDoneStamp({ index, ask }: { index: number; ask: string }) {
  const { record, toggleCheck } = useFirstFilePractice();
  const done = record.checks[index];
  return (
    <button
      type="button"
      className={styles.stamp}
      aria-pressed={done}
      onClick={() => toggleCheck(index)}
    >
      <span className={styles.mark} aria-hidden="true">
        {done ? "확인" : ""}
      </span>
      <span>{done ? FIRST_FILE_CHECKS[index] : ask}</span>
    </button>
  );
}
