"use client";

// Client component: 3-1 screen 5. The visitor card from 2-1 comes back: who reads the page and in what
// situation (where from · on what · how long). Next to it, the page on the screen that reader mostly
// uses. If they read on a phone, check the phone screen first; if on a computer, still look at the phone
// too. With nothing picked in 2-1, the advice is to start from the phone when unsure. Ends by pointing
// out that a page made by AI can still break on a phone, which the next lessons check.
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import { situationLabel } from "@/lib/workbook-plan-options";
import { findPlanButton, planReaders } from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookMyPage, myPageOrSample } from "./WorkbookMyPage";
import { WorkbookVisitorCard } from "./WorkbookPlanRecaps";
import styles from "./WorkbookWhereSeen.module.scss";

const audienceLesson = workbookCourse[1].lessons[workbookProjectStep.audience];

/** 3-1 screen 5: where will my page be read? */
export function WorkbookWhereSeen({ project }: { project: ProjectRecord }) {
  const reader = planReaders.find((item) => item.audience === project.audience.trim()) ?? null;
  const situation = [
    situationLabel("entry", project.entry),
    situationLabel("device", project.device),
    situationLabel("pace", project.pace),
  ].filter((label): label is string => Boolean(label));
  const button = project.buttonLabel.trim() || findPlanButton(project.purpose)?.label || "";
  const device =
    project.device === "desktop" ? "desktop" : project.device === "phone" ? "phone" : null;
  const page = myPageOrSample(project, 3);
  return (
    <div data-lesson-wide className={styles.where}>
      <h2 id="lesson-screen-title" className={styles.title}>
        내 페이지는 어디서 볼까
      </h2>
      <div className={styles.lead}>
        <p>
          {audienceLesson.number}에서 만든 방문자 카드를 다시 가져와 봤어요. 내 페이지를 볼 사람이{" "}
          <strong>무엇으로 보는지</strong>에 따라 먼저 확인할 화면이 정해져요.
        </p>
      </div>

      <div className={styles.desk}>
        <WorkbookVisitorCard
          className={styles.card}
          reader={reader}
          audience={project.audience.trim()}
          situation={situation}
          button={button}
        />
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
        <figure className={styles.screen} data-device={device ?? "phone"}>
          <span className={styles.frame}>
            <span
              className={styles.page}
              style={device === "desktop" ? { width: 953, zoom: 0.3 } : { width: 352, zoom: 0.5 }}
            >
              <WorkbookMyPage {...page} layout={page.layout ?? "two"} mood={page.mood ?? "calm"} />
            </span>
          </span>
          <figcaption>{device === "desktop" ? "컴퓨터에서 먼저" : "휴대폰에서 먼저"}</figcaption>
        </figure>
      </div>

      <p className={styles.advice}>
        {device === "phone" ? (
          <>
            내 페이지를 볼 사람은 주로 휴대폰으로 봐요. 그래서{" "}
            <strong>휴대폰 화면부터 확인하고 맞춰요</strong>. 컴퓨터 화면은 그다음에 봐요.
          </>
        ) : device === "desktop" ? (
          <>
            내 페이지를 볼 사람은 주로 컴퓨터로 봐요. 컴퓨터 화면이 중심이지만, 링크를 휴대폰으로
            여는 사람도 있어서 <strong>휴대폰 화면도 꼭 함께 봐요</strong>.
          </>
        ) : (
          <>
            {audienceLesson.number}에서 무엇으로 보는지 아직 고르지 않았어요. 어떤 기기로 볼지
            모르겠다면 <strong>휴대폰 화면부터 확인해요</strong>.
          </>
        )}
      </p>
      <p className={styles.next}>
        AI가 만든 페이지도 휴대폰에서는 깨질 수 있어요. 이어지는 수업에서 내 페이지를 직접 휴대폰
        크기로 열어 확인해요.
      </p>
    </div>
  );
}
