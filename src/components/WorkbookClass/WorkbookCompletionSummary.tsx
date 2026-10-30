import { classProjectSummary } from "@/lib/workbook-class-summary";
import { WorkbookFirstProjectStatus } from "./WorkbookFirstProjectResult";
import { WorkbookCompletionScreens } from "./WorkbookCompletionScreens";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookCompletionSummary.module.scss";

const learning = {
  ai: [
    "AI 도구 준비하기",
    "AI의 도움과 한계, 모델과 도구의 차이를 구분하고 요청 → 확인 → 수정을 연습했어요.",
  ],
  project: [
    "기획하고 첫 화면 만들기",
    "읽을 사람과 목적을 정하고, 내 콘텐츠를 제작 요청과 첫 화면 확인으로 연결했어요.",
  ],
  experience: [
    "반응형 화면 만들기",
    "작은 화면과 넓은 화면에서 문제를 관찰하고, 한 부분을 고쳐 전후를 비교했어요.",
  ],
  data: [
    "기능과 데이터 저장",
    "입력·표시·저장을 비교하고, 다른 기기에서 값을 읽을 때 서버가 필요한 이유를 판단했어요.",
  ],
  publish: [
    "배포하고 고치기",
    "공개 전 내용과 주소를 점검하고, 문제 재현 → 수정 요청 → 다시 확인하는 흐름을 연습했어요.",
  ],
} as const;

// 완료 기록만 요약한다. 예시 화면을 실제 파일이나 공개 결과로 표현하지 않는다.
export function WorkbookCompletionSummary({ stage }: { stage: keyof typeof learning }) {
  const p = useWorkbookProgress();
  const applied = stage === "ai" ? null : p.applications[stage];
  const summary = classProjectSummary(
    p.projectWorkflow,
    JSON.stringify([
      p.project.title,
      p.project.audience,
      p.project.purpose,
      p.project.intro,
      p.project.content,
    ]),
    p.applications,
  );
  const actual = summary.items.find((item) => item.stage === (stage === "ai" ? "setup" : stage));
  const result =
    stage === "ai"
      ? ["내가 확인한 점", p.practice[4].observation, "다음 수정 요청", p.practice[4].revision]
      : stage === "project"
        ? ["내 페이지 기획", p.project.title, "첫 화면에서 확인한 점", p.project.observation]
        : stage === "experience"
          ? [
              "관찰한 문제",
              p.experience.observation,
              "수정 후 확인한 변화",
              p.experience.comparison,
            ]
          : stage === "data"
            ? ["저장해 본 내용", p.data.saved, "다른 기기와 연결할 때의 판단", p.data.reason]
            : [
                "예시에서 재현한 문제",
                p.publish.actual,
                "수정 후 확인한 변화",
                p.publish.comparison,
              ];
  const scope =
    stage === "ai"
      ? p.practice[4].mode === "computer"
        ? "컴퓨터 실습 · 본인 확인"
        : "예시 복습 기록"
      : stage === "project" && p.project.mode === "computer"
        ? "컴퓨터 제작 · 본인 확인"
        : "학습 예시에서 확인한 결과";
  return (
    <section
      className={styles.summary}
      aria-label="단원 완료 요약"
      tabIndex={0}
      data-visual={stage === "project" || stage === "experience"}
    >
      <div className={styles.learned}>
        <span className="label">LEARNING NOTE</span>
        <h2>{learning[stage][0]} · 학습 완료</h2>
        <p>{learning[stage][1]}</p>
        <small>{scope}</small>
        {(stage === "ai" || stage === "project") && (
          <WorkbookFirstProjectStatus stage={stage === "ai" ? "setup" : "project"} />
        )}
      </div>
      {(stage === "project" || stage === "experience") && (
        <WorkbookCompletionScreens stage={stage} />
      )}
      <div className={styles.result}>
        <h3>내가 남긴 결과</h3>
        <dl>
          {[0, 2].map((index) => (
            <div key={result[index]}>
              <dt>{result[index]}</dt>
              <dd>{result[index + 1] || "작성한 기록은 학습·제작 기록에서 다시 볼 수 있어요."}</dd>
            </div>
          ))}
        </dl>
        {actual?.status === "confirmed" && (
          <p className={styles.applied}>
            내 파일에서 확인한 결과 · 본인 기록 · {actual.evidence.join(" · ")}
          </p>
        )}
        {actual?.application && (actual.status !== "confirmed" || stage === "publish") && (
          <p className={styles.applied}>
            내 파일에 남긴 적용 결과 · 본인 기록 · {actual.application.result}
            <br />
            {actual.applicationStatus === "recheck"
              ? "기록 변경 후 재확인이 필요해요."
              : actual.applicationStatus === "waiting"
                ? `남은 문제: ${applied?.problem}`
                : "기록한 범위의 확인이며 공개·공유·재배포 전체 판정은 별도예요."}
          </p>
        )}
        {applied?.mode === "applied" &&
          applied.confirmed &&
          !applied.review &&
          actual?.status !== "confirmed" && (
            <p className={styles.applied}>
              이전 양식의 적용 기록 · {applied.result || applied.evidence}
              <br />
              현재 실제 목표와 최종 공개 완료 판정은 별도예요.
            </p>
          )}
      </div>
    </section>
  );
}
