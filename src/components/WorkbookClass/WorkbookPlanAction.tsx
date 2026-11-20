"use client";

// Client component: 2-1 screen 3. The page ends in one button; picking a button piece snaps it into the
// bottom slot. What the button does is the plan's "목적" (purpose). The reader's suggested button is
// marked, and the reader says what they will do. The pick goes to the plan record (purpose).
import { Nanum_Pen_Script } from "next/font/google";
import {
  findPlanButton,
  planButtons,
  planReaders,
  type PlanReader,
} from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPlanAction.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** 2-1 screen 3: the purpose of the page is the one button at the bottom. */
export function WorkbookPlanAction({
  record,
  reader,
  update,
}: {
  record: ProjectRecord;
  reader: PlanReader | null;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const chosen = findPlanButton(record.purpose);
  const who = reader ?? planReaders[0];
  return (
    <div data-lesson-wide className={styles.action}>
      <h2 id="lesson-screen-title" className={styles.title}>
        다 읽고 나면 무엇을 하길 바라나요
      </h2>
      <div className={styles.lead}>
        <p>
          페이지의 <strong>목적</strong>은 다 읽은 사람이 하길 바라는 일 하나예요. 그 일은 보통 맨
          아래 <strong>버튼 하나</strong>로 나타나요. 버튼 조각을 맨 아래 자리에 끼워 볼까요?
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.page} aria-label="내 페이지">
          <i className={styles.bar} aria-hidden="true" />
          <i className={styles.bar} aria-hidden="true" />
          <i className={styles.bar} aria-hidden="true" />
          <div className={styles.slot} data-filled={!!chosen}>
            {chosen ? (
              <span key={chosen.id} className={styles.cta}>
                {chosen.label}
              </span>
            ) : (
              <span className={styles.hole}>버튼 자리</span>
            )}
          </div>
        </div>

        <div className={styles.side}>
          <ul className={styles.pieces} aria-label="버튼 조각">
            {planButtons.map((button) => (
              <li key={button.id}>
                <button
                  type="button"
                  className={styles.piece}
                  aria-pressed={chosen?.id === button.id}
                  onClick={() => update({ purpose: button.purpose })}
                >
                  {button.label}
                  {button.id === who.button && <small>{who.tag}에게 추천</small>}
                </button>
              </li>
            ))}
          </ul>
          {chosen && (
            <p key={chosen.id} className={`${styles.voice} ${hand.className}`} aria-live="polite">
              {who.tag}: “다 읽고 나서 ‘{chosen.label}’ 버튼을 누르면 되겠네요.”
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
