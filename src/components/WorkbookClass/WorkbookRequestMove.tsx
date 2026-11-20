"use client";

// Client component: 2-2 screen 1. The 2-1 blueprint pieces on the left move into the four-tag memo
// from 1-5 on the right, one row after another, when the learner presses the button. Each row says
// which part of the plan it came from. Whether the rows were moved is the visit's lesson state; the
// memo text itself is derived from the plan (workbook-plan-memo.ts).
import { workbookCourse, workbookLessonId, workbookProjectStep } from "@/lib/workbook-course";
import { planMemo } from "@/lib/workbook-plan-memo";
import { findPlanButton, planLines } from "@/lib/workbook-plan-readers";
import { layoutLabel, moodLabel } from "@/lib/workbook-plan-options";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookPlanMemoCard } from "./WorkbookPlanMemoCard";
import styles from "./WorkbookRequestMove.module.scss";

const requestLesson = workbookCourse[0].lessons[workbookLessonId.firstRequest];
const planLesson = workbookCourse[1].lessons[workbookProjectStep.audience];
const briefLesson = workbookCourse[1].lessons[workbookProjectStep.brief];

/** 2-2 screen 1: the plan becomes a request by moving it into the memo learned in 1-5. */
export function WorkbookRequestMove({ record }: { record: ProjectRecord }) {
  const [moved, setMoved] = useWorkbookLessonState("request-moved", false);
  const rows = planMemo(record);
  const button = findPlanButton(record.purpose);
  const pieces: [string, string][] = [
    ["제목", record.title.trim()],
    ["읽을 사람", record.audience.trim()],
    ["맨 아래 버튼", record.buttonLabel.trim() || button?.label || record.purpose.trim()],
    [
      "배치 · 분위기",
      [layoutLabel(record.layout), moodLabel(record.mood)].filter(Boolean).join(" · "),
    ],
    ["넣을 내용", planLines(record.content).join(" · ")],
    ["나중에 채울 내용", planLines(record.later).join(" · ")],
  ];
  return (
    <div data-lesson-wide className={styles.move}>
      <h2 id="lesson-screen-title" className={styles.title}>
        기획을 네 칸 메모로 옮겨요
      </h2>
      <div className={styles.lead}>
        <p>
          지난 수업에서 정한 기획을 AI에게 보낼 요청으로 바꿀 차례예요. 새 방법을 배우지 않아도
          됩니다. {requestLesson.number} {requestLesson.title}에서 쓴 <strong>네 칸 메모</strong>
          (무엇을 · 어디에 쓸지 · 조건 · 하지 말 것)에 기획을 옮기면 그대로 요청이 돼요.
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.left}>
          <section className={styles.plan} data-moved={moved} aria-label="지난 수업에서 정한 기획">
            <h3>
              {planLesson.number}~{briefLesson.number}에서 정한 기획
            </h3>
            <dl>
              {pieces.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "비어 있어요"}</dd>
                </div>
              ))}
            </dl>
            {!moved && (
              <button type="button" className={styles.go} onClick={() => setMoved(true)}>
                메모로 옮기기 →
              </button>
            )}
          </section>
          {moved && (
            <p className={styles.closing}>
              칸 아래 작은 글씨가 그 줄이 나온 기획이에요. 기획을 정해 두면 요청은 옮겨 적기만 하면
              됩니다.
            </p>
          )}
        </div>
        <WorkbookPlanMemoCard
          rows={rows}
          label="기획을 옮긴 메모"
          showFrom
          compact
          shown={moved ? rows.length : 0}
        />
      </div>
    </div>
  );
}
