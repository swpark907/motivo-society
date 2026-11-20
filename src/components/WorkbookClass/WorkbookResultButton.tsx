"use client";

// Client component: 2-3 screen 2. The learner presses the page's bottom button; nothing happens. The
// screen explains that a button has two parts — how it looks (there now) and what it does when pressed
// (not made yet, if no destination was decided) — and that making it do something comes in a later
// unit. Presses are the visit's lesson state.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { resultPieces } from "@/lib/workbook-result-check";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookPracticePage } from "./WorkbookPracticePage";
import styles from "./WorkbookResultButton.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });
const behaviorUnit = workbookCourse[3];
const requestLesson = workbookCourse[1].lessons[workbookProjectStep.request];

/** 2-3 screen 2: a button is a look and an action. */
export function WorkbookResultButton({ record }: { record: ProjectRecord }) {
  const [pressed, setPressed] = useWorkbookLessonState("result-button-pressed", 0);
  const button = resultPieces(record).find((piece) => piece.id === "button")!.plan;
  return (
    <div data-lesson-wide className={styles.button}>
      <h2 id="lesson-screen-title" className={styles.title}>
        맨 아래 버튼을 눌러 봐요
      </h2>
      <div className={styles.lead}>
        <p>페이지 맨 아래 ‘{button}’ 버튼을 눌러 볼까요? 내 화면에서도 눌러 보세요.</p>
      </div>

      <div className={styles.desk}>
        <div className={styles.stage}>
          <WorkbookPracticePage
            record={record}
            variant="after"
            label="버튼을 눌러 볼 연습 화면"
            onButton={() => setPressed(pressed + 1)}
          />
          {pressed > 0 && (
            <div className={styles.capy}>
              <p key={pressed} className={`${styles.bubble} ${hand.className}`}>
                어? 아무 일도 안 일어나네?
              </p>
              <Image
                src="/images/workbook/lesson-1-2/capy-puzzled.png"
                alt=""
                aria-hidden="true"
                width={267}
                height={480}
              />
            </div>
          )}
        </div>

        <section className={styles.explain} aria-live="polite">
          {pressed === 0 ? (
            <p className={styles.wait}>버튼을 누르면 무슨 일이 일어나는지 봐요.</p>
          ) : (
            <>
              <p>
                {requestLesson.number}에서 누르면 갈 곳을 정하지 않았다면, 지금은 눌러도 아무 일이
                없을 수 있어요. 고장 난 게 아니에요. 버튼은 두 가지로 이루어져 있거든요.
              </p>
              <dl className={styles.parts}>
                <div data-state="done">
                  <dt>보이는 모양</dt>
                  <dd>버튼 글자와 자리 · 지금 있어요</dd>
                </div>
                <div data-state="later">
                  <dt>눌렀을 때 하는 일</dt>
                  <dd>
                    다른 화면으로 가기, 신청 받기 같은 동작 · {behaviorUnit.number}단원{" "}
                    {behaviorUnit.title}에서 만들어요
                  </dd>
                </div>
              </dl>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
