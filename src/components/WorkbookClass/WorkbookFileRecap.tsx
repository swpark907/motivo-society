"use client";

// Client component: reads the visit's progress to say whether unit 1 is really finished, whether
// the first-file check was recorded, and to pin what the learner wrote in this lesson.
import { workbookCourse, workbookLessonId } from "@/lib/workbook-course";
import { isUnitOneDone, unitOneRemaining } from "@/lib/workbook-lesson-records";
import { useFirstFilePractice } from "./useFirstFilePractice";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookFileRecap.module.scss";

/** What "첫 코드 만들기" covered, in the order the screens showed it. */
const LEARNED = [
  "부탁하면 AI가 내 폴더에 파일을 만들어요.",
  "만든 파일은 열어서 눈으로 확인해요.",
  "고치고 나면 새로고침해야 바뀐 화면이 보여요.",
] as const;

/**
 * 1-6 screen 6: the recap as a framed picture of the first page (cards, notebook page, receipt,
 * pass, memo board — the form changes again). The ticket points to the next unit, read from
 * src/lib/workbook-course.ts; it says unit 1 is finished only when the other lessons are done.
 */
export function WorkbookFileRecap() {
  const { completed, setupStatus } = useWorkbookProgress();
  const { record } = useFirstFilePractice();
  const next = workbookCourse[1];
  const setup = workbookCourse[0].lessons[workbookLessonId.setup];
  const unitDone = isUnitOneDone(completed, workbookLessonId.firstFile);
  const remaining = unitOneRemaining(completed, workbookLessonId.firstFile);
  const observation = record.observation.trim();
  const revision = record.revision.trim();
  const allStamps = record.mode === "computer" && record.checks.every(Boolean);
  // 2단원이 읽는 "첫 파일 확인" 기록이 남는지, 빠진 것이 있으면 무엇인지 알려 준다.
  const check = !allStamps
    ? null
    : !observation
      ? "화면 3에 본 것을 한 줄 적으면, 다음 단원에서 내 파일을 확인한 기록으로 이어져요."
      : setupStatus !== "ready"
        ? `‘${setup.title}’ 수업의 준비 도장을 다 찍으면 내 파일을 확인한 기록으로 이어져요.`
        : "내 파일을 확인한 기록이 남아요. 다음 단원에서 이어서 써요.";
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>

      <div className={styles.layout}>
        <div className={styles.wall}>
          <figure className={styles.frame}>
            <div className={styles.picture} aria-hidden="true">
              <strong>내 소개</strong>
              <i />
              <i />
              <i />
            </div>
            <figcaption>나의 첫 화면 · index.html</figcaption>
          </figure>
          <ol className={styles.lines}>
            {LEARNED.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>

        <div className={styles.aside}>
          {(observation || revision || check) && (
            <dl className={styles.mine}>
              {observation && (
                <>
                  <dt>내가 본 것</dt>
                  <dd>{observation}</dd>
                </>
              )}
              {revision && (
                <>
                  <dt>적어 둔 수정 요청</dt>
                  <dd>{revision}</dd>
                </>
              )}
              {check && <p className={styles.check}>{check}</p>}
            </dl>
          )}
          <aside className={styles.ticket} aria-labelledby="file-next-title">
            <span className={styles.ticketLabel}>
              {unitDone ? "1단원을 마쳤어요 · 다음 단원" : "다음 단원"}
            </span>
            <h3 id="file-next-title">
              <span>{next.number}단원</span> {next.title}
            </h3>
            <p>오늘 만든 폴더와 파일을 그대로 이어서, 내 페이지를 기획하고 첫 화면을 만들어요.</p>
            {!unitDone && (
              <p className={styles.remaining}>
                남은 수업 ·{" "}
                {remaining.map((lesson) => `${lesson.number} ${lesson.title}`).join(", ")}
                <br />
                1단원을 다 마치면 열려요.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
