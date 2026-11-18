import type { CSSProperties } from "react";
import { workbookCourse, workbookLessonId } from "@/lib/workbook-course";
import styles from "./WorkbookUsageRecap.module.scss";

/** What 1-3 covered, in the order the screens showed it. */
const LEARNED = [
  { term: "토큰", text: "AI가 글을 읽고 쓸 때 세는 조각" },
  { term: "컨텍스트", text: "AI가 한 번에 볼 수 있는 범위" },
  { term: "아껴 쓰기", text: "새 대화 · 작게 나누기 · 필요한 파일만" },
] as const;

/**
 * 1-3 screen 6: the recap as a receipt, since the lesson is about how much gets used
 * (1-1 used three cards and 1-2 a notebook page, so the form changes again).
 * The lines print in order once (CSS); reduced motion shows the finished receipt.
 * The next lesson is 1-4 from src/lib/workbook-course.ts.
 */
export function WorkbookUsageRecap() {
  const current = workbookCourse[0].lessons[workbookLessonId.usage];
  const next = workbookCourse[0].lessons[workbookLessonId.setup];
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>

      <div className={styles.layout}>
        <div className={styles.receipt}>
          <p className={styles.head}>
            {current.title}
            <span>LESSON {current.number}</span>
          </p>
          <ol className={styles.lines}>
            {LEARNED.map((item, index) => (
              <li key={item.term} style={{ "--i": index } as CSSProperties}>
                <strong>{item.term}</strong>
                <span className={styles.dots} aria-hidden="true" />
                <span>{item.text}</span>
              </li>
            ))}
          </ol>
          <p className={styles.total} style={{ "--i": LEARNED.length } as CSSProperties}>
            <span>합계</span>
            <strong>알게 된 것 3가지</strong>
          </p>
        </div>

        <aside className={styles.ticket} aria-labelledby="usage-next-title">
          <span className={styles.ticketLabel}>다음 수업</span>
          <h3 id="usage-next-title">
            <span>{next.number}</span> {next.title}
          </h3>
          <p>Claude Code를 설치하고, 작업할 폴더를 정해요.</p>
        </aside>
      </div>
    </div>
  );
}
