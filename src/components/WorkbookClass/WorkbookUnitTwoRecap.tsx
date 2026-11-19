// 2-3 정리: 오늘 알게 된 것과 2단원 한 장(기획 → 요청 → 확인). 다음 단원 표는 workbook-course.ts에서 읽는다.
import { workbookCourse } from "@/lib/workbook-course";
import { planLines } from "@/lib/workbook-plan-readers";
import { nextUnitAfterProject } from "@/lib/workbook-result-check";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookUnitTwoRecap.module.scss";

const LEARNED = [
  "화면은 느낌으로 보지 않고, 설계도 조각을 하나씩 맞춰 봐요.",
  "버튼은 보이는 모양과 눌렀을 때 하는 일이 따로예요.",
  "다른 곳은 한 번에 하나씩, 바꿀 것과 그대로 둘 것을 같이 말해요.",
  "고친 뒤에는 새로고침하고 고치기 전과 비교해요.",
] as const;

export function WorkbookUnitTwoRecap({ record }: { record: ProjectRecord }) {
  const [plan, request, check] = workbookCourse[1].lessons;
  const computer = record.mode === "computer";
  const stamps = record.checks.filter(Boolean).length;
  const steps = [
    {
      lesson: plan,
      made: record.title.trim() || "제목을 정하지 않았어요",
      note: `${planLines(record.content).length}가지 내용 · 맨 아래 버튼`,
    },
    {
      lesson: request,
      made: "네 칸 메모",
      note: computer
        ? "Claude 앱으로 보냈어요"
        : record.mode === "example"
          ? "예시로 따라왔어요"
          : "아직 보내지 않았어요",
    },
    {
      lesson: check,
      made: computer ? `확인 도장 ${stamps} / 3` : "연습 화면으로 확인",
      note:
        record.observation.trim() ||
        (computer ? "본 것 한 줄은 비워 뒀어요" : "컴퓨터가 준비되면 내 페이지로"),
    },
  ];
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>
      <div className={styles.layout}>
        <ol className={styles.learned} aria-label="오늘 알게 된 것">
          {LEARNED.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <div className={styles.side}>
          <ol className={styles.unit} aria-label={`${workbookCourse[1].number}단원 한 장 정리`}>
            {steps.map((step) => (
              <li key={step.lesson.slug}>
                <span>
                  {step.lesson.number} {step.lesson.title}
                </span>
                <strong>{step.made}</strong>
                <small>{step.note}</small>
              </li>
            ))}
          </ol>
          <aside className={styles.ticket} aria-labelledby="unit-two-next">
            <span>다음 단원</span>
            <h3 id="unit-two-next">
              <b>{nextUnitAfterProject.number}단원</b> {nextUnitAfterProject.title}
            </h3>
            <p>같은 페이지를 휴대폰과 넓은 화면에서 열어 보고, 어긋나는 곳을 고쳐요.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
