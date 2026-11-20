"use client";

// Client component: 2-3 screen 4. After the fix, the page is refreshed and compared: the practice page
// before and after the fix are stacked, and a slider reveals one over the other. With computer practice
// the learner stamps three checks on their own page (same file only · looks like the blueprint · the
// button is there) and may leave one line about what they saw; that line is the evidence the record
// keeps (no line, no "confirmed"). Slider position is the visit's lesson state.
import { planLines } from "@/lib/workbook-plan-readers";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookPracticePage } from "./WorkbookPracticePage";
import styles from "./WorkbookResultAfter.module.scss";

export const RESULT_CHECKS = [
  "my-first-web의 index.html만 바뀌었어요",
  "설계도의 제목 · 소개 글 · 내용 순서대로 보여요",
  "맨 아래 버튼이 보여요",
] as const;

/** 2-3 screen 4: refresh, then compare before and after. */
export function WorkbookResultAfter({
  record,
  onCheck,
  onObserve,
}: {
  record: ProjectRecord;
  onCheck: (index: number, value: boolean) => void;
  onObserve: (text: string) => void;
}) {
  const [split, setSplit] = useWorkbookLessonState("result-split", 50);
  const [met, setMet] = useWorkbookLessonState<string[]>("result-criteria-met", []);
  const criteria = planLines(record.criteria);
  const audienceLesson = workbookCourse[1].lessons[workbookProjectStep.audience];
  const computer = record.mode === "computer";
  return (
    <div data-lesson-wide className={styles.after}>
      <h2 id="lesson-screen-title" className={styles.title}>
        새로고침하고, 고치기 전과 비교해요
      </h2>
      <div className={styles.lead}>
        <p>
          AI가 고쳤다고 하면 브라우저에서 <strong>새로고침</strong>해야 바뀐 화면이 보여요. 그다음
          고치기 전과 비교해서 부탁한 곳만 바뀌었는지 봅니다. 아래 손잡이를 좌우로 움직여 볼까요?
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.compare}>
          <div className={styles.stack}>
            <WorkbookPracticePage
              record={record}
              variant="after"
              label="고친 뒤 (연습)"
              tag="고친 뒤"
            />
            <div
              className={styles.before}
              style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
              aria-hidden="true"
            >
              <WorkbookPracticePage
                record={record}
                variant="before"
                label="고치기 전 (연습)"
                tag="고치기 전"
              />
            </div>
            <span className={styles.line} style={{ left: `${split}%` }} aria-hidden="true" />
          </div>
          <label className={styles.slider}>
            <span>고치기 전</span>
            <input
              type="range"
              min={0}
              max={100}
              value={split}
              aria-label="고치기 전과 고친 뒤 비교"
              onChange={(event) => setSplit(Number(event.target.value))}
            />
            <span>고친 뒤</span>
          </label>
        </div>

        <div className={styles.side}>
          {criteria.length > 0 && (
            <fieldset className={styles.criteria}>
              <legend>{audienceLesson.number}에서 정한 잘 됐다는 기준</legend>
              {criteria.map((line) => (
                <label key={line}>
                  <input
                    type="checkbox"
                    checked={met.includes(line)}
                    onChange={(event) =>
                      setMet(
                        event.target.checked ? [...met, line] : met.filter((item) => item !== line),
                      )
                    }
                  />
                  <span>{line}</span>
                </label>
              ))}
            </fieldset>
          )}
          {computer ? (
            <>
              <fieldset className={styles.checks}>
                <legend>내 화면에서 확인했으면 도장을 찍어요</legend>
                {RESULT_CHECKS.map((label, index) => (
                  <label key={label}>
                    <input
                      type="checkbox"
                      checked={record.checks[index] ?? false}
                      onChange={(event) => onCheck(index, event.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <label className={styles.observe}>
                <span>
                  내 화면에서 본 것 한 줄 <small>안 적어도 돼요</small>
                </span>
                <input
                  type="text"
                  value={record.observation}
                  placeholder="예: 순서가 설계도대로 바뀌었고, 버튼도 보여요."
                  autoComplete="off"
                  onChange={(event) => onObserve(event.target.value)}
                />
                <small>적어 두면 다음 단원에서 이 화면을 출발점으로 이어 써요.</small>
              </label>
            </>
          ) : (
            <p className={styles.later}>
              컴퓨터가 준비되면 내 페이지에서도 같은 순서로 해 봐요. 고쳐 달라고 보내고 → 새로고침 →
              고치기 전과 비교.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
