"use client";

// Client component: 2-1 screen 4. A check sheet of "how we'll know it worked" criteria; the learner
// ticks two or three. Criteria that fit the chosen situation are marked as suggested. Picks go to the
// plan record (criteria, one per line); 2-6 checks the page against them.
import { criteriaOptions, suggestedCriteria } from "@/lib/workbook-plan-options";
import { planLines } from "@/lib/workbook-plan-readers";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPlanCriteria.module.scss";

const checkLesson = workbookCourse[1].lessons[workbookProjectStep.result];

/** 2-1 screen 4: decide how to tell it worked, before making anything. */
export function WorkbookPlanCriteria({
  record,
  update,
}: {
  record: ProjectRecord;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const picked = planLines(record.criteria);
  const suggested = suggestedCriteria(record);
  function toggle(line: string) {
    const next = picked.includes(line) ? picked.filter((item) => item !== line) : [...picked, line];
    update({ criteria: next.join("\n") });
  }
  return (
    <div data-lesson-wide className={styles.criteria}>
      <h2 id="lesson-screen-title" className={styles.title}>
        다 만들면 무엇으로 확인할까요
      </h2>
      <div className={styles.lead}>
        <p>
          만들기 전에 <strong>잘 됐다는 기준</strong>을 먼저 정해 두면, 끝났을 때 무엇을 보면 되는지
          알 수 있어요. {checkLesson.number} {checkLesson.title}에서 이 기준으로 내 페이지를
          확인합니다. 두세 개만 골라 볼까요?
        </p>
      </div>

      <section className={styles.sheet} aria-label="잘 됐다는 기준">
        <header>
          <strong>검수표</strong>
          <span>{picked.length}개 골랐어요</span>
        </header>
        <ul>
          {criteriaOptions.map((line) => (
            <li key={line}>
              <button
                type="button"
                aria-pressed={picked.includes(line)}
                onClick={() => toggle(line)}
              >
                <span className={styles.box} aria-hidden="true">
                  {picked.includes(line) ? "✓" : ""}
                </span>
                <span>{line}</span>
                {suggested.has(line) && <small>내 상황에 맞아요</small>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
