"use client";

// Client component: 2-2 screen 4. A practice approval window shows what would change in index.html as
// − (removed) and + (added) lines built from the learner's plan, plus one line nobody asked for. The
// learner taps lines to check them; the planted line is the one to catch. Taps are the visit's
// lesson state. With computer practice, the learner stamps that they approved after checking (kept
// in the plan record as `approved`). What the real app's prompt looks like differs by app version,
// so the copy says "if the app shows the change", not how it always looks.
import { ASK_INTRO, findPlanButton, planLines } from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { FIRST_PAGE_TITLE } from "./WorkbookFileAsk";
import styles from "./WorkbookRequestDiff.module.scss";

/** 아무도 부탁하지 않았는데 들어간 줄(찾아낼 줄). */
const PLANTED = "웹 개발 경력 3년";

type Line = { sign: "-" | "+"; text: string; planted?: boolean };

/** 2-2 screen 4: before approving, read the − and + lines. */
export function WorkbookRequestDiff({
  record,
  update,
}: {
  record: ProjectRecord;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const [checked, setChecked] = useWorkbookLessonState<number[]>("request-diff-checked", []);
  const intro = record.intro.trim();
  const button = findPlanButton(record.purpose);
  const now = planLines(record.content).slice(0, 2);
  const lines: Line[] = [
    { sign: "-", text: `제목: ${FIRST_PAGE_TITLE}` },
    { sign: "+", text: `제목: ${record.title.trim() || "(새 제목)"}` },
    {
      sign: "+",
      text: `소개 글: ${intro && intro !== ASK_INTRO ? intro : "(물어보고 채운 소개 글)"}`,
    },
    ...now.map((item): Line => ({ sign: "+", text: `${item}: (물어보고 채운 내용)` })),
    { sign: "+", text: PLANTED, planted: true },
    { sign: "+", text: `버튼: ${record.buttonLabel.trim() || button?.label || "(맨 아래 버튼)"}` },
  ];
  const plantedIndex = lines.findIndex((line) => line.planted);
  const found = checked.includes(plantedIndex);
  const last = checked.at(-1);
  const sent = record.mode === "computer";

  function tap(index: number) {
    setChecked(checked.includes(index) ? checked : [...checked, index]);
  }

  return (
    <div data-lesson-wide className={styles.diff}>
      <h2 id="lesson-screen-title" className={styles.title}>
        승인하기 전에 바뀌는 부분을 읽어요
      </h2>
      <div className={styles.lead}>
        <p>
          Claude 앱이 파일을 고치기 전에 바뀌는 내용을 보여 주면, 줄 앞의 기호를 보세요.{" "}
          <strong>−는 지워지는 줄</strong>, <strong>+는 더해지는 줄</strong>이에요. 아래는 연습용
          창입니다. 내가 부탁하지 않은 줄이 하나 섞여 있어요. 줄을 눌러 찾아볼까요?
        </p>
      </div>

      <div className={styles.desk}>
        <section className={styles.window} aria-label="바뀌는 부분 (연습)">
          <header>
            <strong>index.html 고치기 (연습)</strong>
            <code>my-first-web/index.html</code>
          </header>
          <ol className={styles.lines}>
            {lines.map((line, index) => (
              <li key={`${line.sign}${line.text}`}>
                <button
                  type="button"
                  className={styles.line}
                  data-sign={line.sign === "-" ? "minus" : "plus"}
                  data-checked={checked.includes(index)}
                  data-planted={line.planted && checked.includes(index)}
                  onClick={() => tap(index)}
                >
                  <span className={styles.sign} aria-hidden="true">
                    {line.sign === "-" ? "−" : "+"}
                  </span>
                  <span>{line.text}</span>
                  {line.planted && checked.includes(index) && (
                    <em className={styles.flag}>내가 말하지 않은 내용</em>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className={styles.side}>
          <ol className={styles.checks} aria-label="승인하기 전에 볼 두 가지">
            <li>
              고치는 파일이 <code>my-first-web/index.html</code>인가요? 창 위쪽의 파일 이름을 봐요.
            </li>
            <li data-done={found}>내가 말하지 않은 내용이 들어가지 않았나요?</li>
          </ol>
          <p className={styles.feedback} aria-live="polite">
            {last === undefined
              ? ""
              : last === plantedIndex
                ? "찾았어요. 이럴 땐 승인하지 말고 거절한 뒤, “경력은 넣지 마”라고 다시 말해요."
                : found
                  ? "이 줄은 메모에서 부탁한 내용이에요."
                  : "이 줄은 메모에서 부탁한 내용이에요. 부탁하지 않은 줄이 하나 더 있어요."}
          </p>
          {sent && (
            <button
              type="button"
              className={styles.stamp}
              aria-pressed={record.approved}
              onClick={() => update({ approved: !record.approved })}
            >
              <span className={styles.mark} aria-hidden="true">
                {record.approved ? "확인" : ""}
              </span>
              <span>
                {record.approved
                  ? "확인하고 승인했어요"
                  : "내 앱에서 두 가지를 보고 승인했으면 도장을 찍어요"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
