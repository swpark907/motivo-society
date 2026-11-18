import Image from "next/image";
import { workbookCourse, workbookLessonId } from "@/lib/workbook-course";
import styles from "./WorkbookSetupRecap.module.scss";

/** What 1-4 covered, in the order the screens showed it. */
const LEARNED = [
  "Claude Code는 Claude 앱의 Code 탭에 있어요.",
  "코드 에이전트는 정해 준 폴더 안에서 일해요.",
  "우리는 내 컴퓨터의 my-first-web 폴더에서 시작해요.",
] as const;

/**
 * 1-4 screen 6: the recap as a workroom pass on a lanyard (1-1 cards, 1-2 notebook page,
 * 1-3 receipt — the form changes again). No motion. The next lesson is 1-5 from
 * src/lib/workbook-course.ts.
 */
export function WorkbookSetupRecap() {
  const next = workbookCourse[0].lessons[workbookLessonId.firstRequest];
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>

      <div className={styles.layout}>
        <div className={styles.pass}>
          <span className={styles.strap} aria-hidden="true" />
          <div className={styles.passHead}>
            <Image
              className={styles.photo}
              src="/images/workbook/lesson-1-2/capy-thumb.png"
              alt=""
              width={295}
              height={480}
            />
            <p>
              작업실 출입증
              <span>my-first-web</span>
            </p>
          </div>
          <ol className={styles.lines}>
            {LEARNED.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>

        <aside className={styles.ticket} aria-labelledby="setup-next-title">
          <span className={styles.ticketLabel}>다음 수업</span>
          <h3 id="setup-next-title">
            <span>{next.number}</span> {next.title}
          </h3>
          <p>원하는 결과를 말로 잘 전하는 법을 익혀요.</p>
        </aside>
      </div>
    </div>
  );
}
