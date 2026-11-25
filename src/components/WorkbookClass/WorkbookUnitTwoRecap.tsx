// 2-6 정리이자 2단원 마무리 장면: 2단원 내내 자란 내 페이지가 완성된 모습과, 그 페이지를 본 읽을 사람
// (카피바라)의 엄지. 옆에는 오늘 알게 된 것과 2단원 한 장(기획서 → 요청 → 확인), 다음 단원 표.
// 수업 번호는 workbook-course.ts의 workbookProjectStep에서 읽는다.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import { planLines, planReaders } from "@/lib/workbook-plan-readers";
import { nextUnitAfterProject } from "@/lib/workbook-result-check";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookMyPage, myPageFromRecord } from "./WorkbookMyPage";
import { WorkbookRecapStamp } from "./WorkbookRecapStamp";
import { WorkbookRecapLines, type RecapLine } from "./WorkbookPlanRecaps";
import styles from "./WorkbookUnitTwoRecap.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

const LEARNED: readonly RecapLine[] = [
  {
    term: "화면은 설계도 조각으로 맞춰 봐요",
    text: "느낌으로 보지 않고 제목 · 소개 글 · 버튼 · 내용 순서를 하나씩 화면과 비교해요.",
  },
  {
    term: "버튼은 모양과 하는 일이 따로예요",
    text: "버튼이 보여도, 눌렀을 때 갈 곳은 따로 정해서 부탁해야 해요.",
  },
  {
    term: "다른 곳은 한 번에 하나씩 고쳐요",
    text: "바꿀 것과 그대로 둘 것을 같이 말해야 다른 곳이 망가지지 않아요.",
  },
  {
    term: "고친 뒤에는 새로고침하고 비교해요",
    text: "고치기 전과 나란히 놓고, 처음에 정한 기준을 다시 확인해요.",
  },
];

export function WorkbookUnitTwoRecap({ record }: { record: ProjectRecord }) {
  const lessons = workbookCourse[1].lessons;
  const plan = lessons[workbookProjectStep.brief];
  const request = lessons[workbookProjectStep.request];
  const check = lessons[workbookProjectStep.result];
  const reader = planReaders.find((item) => item.audience === record.audience.trim());
  const page = myPageFromRecord(record, 4);
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
        <div className={styles.scene}>
          <div className={styles.pageWrap}>
            <WorkbookRecapStamp label={`${workbookCourse[1].number}단원 완료`} />
            <WorkbookMyPage
              {...page}
              mood={page.mood ?? "calm"}
              caption={
                computer
                  ? "2단원에서 기획한 대로 그린 내 페이지예요. 실제 화면은 브라우저에서 확인한 그 파일이에요."
                  : "2단원에서 기획한 대로 그린 내 페이지예요. 컴퓨터가 준비되면 같은 기획으로 내 파일을 만들어요."
              }
            />
          </div>
          <div className={styles.capy} aria-hidden="true">
            <p className={`${styles.bubble} ${hand.className}`}>
              {reader ? `${reader.tag}: ` : ""}“찾던 게 한눈에 보여요!”
            </p>
            <Image
              src="/images/workbook/lesson-1-2/capy-thumb.png"
              alt=""
              width={295}
              height={480}
            />
          </div>
        </div>
        <div className={styles.side}>
          <WorkbookRecapLines lines={LEARNED} variant="callout" />
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
