// 기획 수업(2-1~2-3)의 정리 화면: 오늘 알게 된 것과, 이 수업에서 정한 것 한 장, 다음 수업 표.
import { workbookCourse } from "@/lib/workbook-course";
import styles from "./WorkbookPlanStepRecap.module.scss";

export function WorkbookPlanStepRecap({
  point,
  learned,
  decided,
}: {
  point: number;
  learned: readonly string[];
  /** 이 수업에서 정한 것 [이름, 값]. 값이 비어 있으면 "아직 고르지 않았어요". */
  decided: readonly (readonly [string, string])[];
}) {
  const next = workbookCourse[1].lessons[point + 1];
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>
      <div className={styles.layout}>
        <ol className={styles.learned} aria-label="오늘 알게 된 것">
          {learned.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <div className={styles.side}>
          <dl className={styles.card} aria-label="이번 수업에서 정한 것">
            {decided.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd data-empty={!value}>{value || "아직 고르지 않았어요"}</dd>
              </div>
            ))}
          </dl>
          <aside className={styles.ticket} aria-labelledby={`plan-next-${point}`}>
            <span>다음 수업</span>
            <h3 id={`plan-next-${point}`}>
              {next.number} {next.title}
            </h3>
          </aside>
        </div>
      </div>
    </div>
  );
}
