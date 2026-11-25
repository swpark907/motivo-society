"use client";

// Client component: 2-1 screen 2. Three short questions about the reader's situation (where they come
// from, what they look at it on, how long they stay), each answered by picking a chip. The device
// frame on the right changes shape (phone or laptop) and lists what the first screen has to show for
// that situation. Picks go to the plan record (entry · device · pace).
import { situationGroups } from "@/lib/workbook-plan-options";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPlanSituation.module.scss";

/** 2-1 screen 2: the same reader in a different situation needs a different first screen. */
export function WorkbookPlanSituation({
  record,
  update,
}: {
  record: ProjectRecord;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const needs = situationGroups
    .map((group) => group.options.find((option) => option.id === record[group.key])?.need)
    .filter((need): need is string => Boolean(need));
  const device = record.device === "desktop" ? "desktop" : "phone";
  return (
    <div data-lesson-wide className={styles.situation}>
      <h2 id="lesson-screen-title" className={styles.title}>
        그 사람은 어떤 상황에서 열어 볼까요
      </h2>
      <div className={styles.lead}>
        <p>
          같은 사람이라도 어디서, 무엇으로, 얼마나 보느냐에 따라{" "}
          <strong>첫 화면에서 먼저 보여야 할 것</strong>이 달라져요. 가장 흔할 것 같은 상황을 하나씩
          골라 볼까요?
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.questions}>
          {situationGroups.map((group) => (
            <fieldset key={group.key} className={styles.group}>
              <legend>{group.question}</legend>
              <div className={styles.chips}>
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={record[group.key] === option.id}
                    onClick={() => update({ [group.key]: option.id })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <figure
          className={styles.device}
          data-device={device}
          aria-label="첫 화면에 먼저 보여야 할 것"
        >
          <div className={styles.screen}>
            <strong>첫 화면에 먼저 보여야 할 것</strong>
            {needs.length === 0 ? (
              <p className={styles.empty}>상황을 고르면 여기에 적혀요.</p>
            ) : (
              <ol aria-live="polite">
                {needs.map((need) => (
                  <li key={need}>{need}</li>
                ))}
              </ol>
            )}
          </div>
          <figcaption>{device === "phone" ? "휴대폰으로 볼 때" : "컴퓨터로 볼 때"}</figcaption>
        </figure>
      </div>
    </div>
  );
}
