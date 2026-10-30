"use client";

import { workbookCourse } from "@/lib/workbook-course";
import { applicationStages, type ApplicationStage } from "@/lib/workbook-application";
import { actualStatusLabels, classProjectSummary } from "@/lib/workbook-class-summary";
import type { ProjectStage } from "@/lib/workbook-project-progress";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { WorkbookCompletionScreens } from "./WorkbookCompletionScreens";
import system from "./WorkbookLesson.module.scss";

const cores = [
  "AI의 도움과 한계 · 요청하고 결과 확인하기",
  "읽을 사람과 목적 · 기획을 같은 파일의 요청으로",
  "두 화면 관찰 · 한 부분 개선 · 전후와 버튼 확인",
  "입력·표시·저장 · 다른 기기와 함께 읽는 범위",
  "공개 전 점검 · 주소와 배포 · 재현과 재확인",
];

export function WorkbookClassSummary({ standalone = false }: { standalone?: boolean }) {
  const p = useWorkbookProgress();
  const [tab, setTab] = useWorkbookLessonState("class-summary-tab", "learned");
  const done = [
    p.completed.length === 5,
    p.projectCompleted,
    p.experienceCompleted,
    p.dataCompleted,
    p.publishCompleted,
  ];
  const allLearned = done.every(Boolean);
  const plan = JSON.stringify([
    p.project.title,
    p.project.audience,
    p.project.purpose,
    p.project.intro,
    p.project.content,
  ]);
  const actual = classProjectSummary(p.projectWorkflow, plan, p.applications);
  const legacy = (Object.keys(applicationStages) as ApplicationStage[]).filter((stage) => {
    const item = p.applications[stage];
    return (
      !item.review &&
      (item.mode === "applied" || item.result.trim() || item.evidence.trim() || item.problem.trim())
    );
  });
  const hasActualRecords =
    legacy.length > 0 ||
    actual.applications.length > 0 ||
    Object.values(p.projectWorkflow.checkpoints).some(
      (item) =>
        item.outcome !== "unverified" ||
        item.evidence.trim() ||
        item.obstacle.trim() ||
        item.confirmation,
    ) ||
    Object.values(p.projectWorkflow.decisions).some((item) => item.value !== null);
  function open(stage: ProjectStage) {
    if (stage === "setup" || stage === "project") {
      p.setReviewView(null);
      if (stage === "project") p.setProjectStop(2);
      p.setLesson(stage === "setup" ? 4 : 5);
    } else p.setReviewView(stage);
    p.setScene(2);
  }
  if (!standalone)
    return (
      <section id="workbook-class-summary" aria-label="클래스 마무리">
        <h3>배움과 실제 프로젝트 기록</h3>
        <p>
          기본 {done.filter(Boolean).length}/5단원 학습 · 실제 목표 {actual.confirmed.length}개 본인
          확인
        </p>
        <p>
          {actual.complete
            ? "최종 프로젝트 확인 기록이 있어요."
            : "실제 공개와 재배포까지의 결과 확인은 학습 완료와 별개예요."}
        </p>
        <button
          disabled={!allLearned}
          onClick={() => {
            p.setReviewView("summary");
            p.setScene(2);
          }}
        >
          클래스 학습 정리 보기 →
        </button>
      </section>
    );
  return (
    <section
      id="workbook-class-summary"
      aria-label="클래스 마무리"
      className={system.practiceStage}
    >
      <div className={system.resultTabs} role="group" aria-label="정리할 기록">
        {[
          ["learned", "배운 핵심"],
          ["actual", "실제 결과"],
          ["next", "남은 일"],
        ].map(([key, label]) => (
          <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "learned" && (
        <section className={system.practiceStage} aria-label="배운 핵심">
          <h2 className={system.screenTitle}>배운 핵심을 다음 작업의 기준으로</h2>
          <table
            className={`${system.aiResultTable} ${system.aiCheckTable}`}
            aria-label="단원별 배운 핵심"
          >
            <thead>
              <tr>
                <th scope="col">단원</th>
                <th scope="col">가져갈 핵심</th>
              </tr>
            </thead>
            <tbody>
              {workbookCourse.map((unit, index) => (
                <tr key={unit.stage}>
                  <th scope="row">
                    {unit.number}. {unit.title}
                  </th>
                  <td>{cores[index]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={system.recapScope}>
            기본 {done.filter(Boolean).length}/5단원의 학습 기록이에요. 예시를 확인한 것과 내 파일을
            만들고 공개한 결과는 나눠 봐요.
          </p>
          <details className={system.preparationMore}>
            <summary>내가 남긴 학습 기록 보기</summary>
            <dl className={system.recapPoints}>
              {[
                ["기획", p.project.title],
                ["첫 화면 확인", p.project.observation],
                ["화면 비교", p.experience.comparison],
                ["표시·저장·공유", p.data.reason],
                ["문제 해결 예시", p.publish.comparison],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "아직 남긴 기록이 없어요"}</dd>
                </div>
              ))}
            </dl>
          </details>
        </section>
      )}
      {tab === "actual" && (
        <section className={system.practiceStage} aria-label="내 프로젝트에서 확인한 것">
          <h2 className={system.screenTitle}>내 파일에서 확인한 범위</h2>
          {hasActualRecords ? (
            <p>
              현재 프로젝트의 확인 기록에서 <strong>{actual.confirmed.length}개 목표</strong>가
              확인됐어요. 자동 파일 검사나 배포 성공 인증이 아닌 본인 기록이에요.
            </p>
          ) : (
            <p>
              이번에는 예시로 학습했어요. 내 컴퓨터에서 만든 결과를 확인하면 여기에 남길 수 있어요.
            </p>
          )}
          {actual.confirmed.length ? (
            <dl className={system.recapPoints}>
              {actual.confirmed.map((item) => (
                <div key={item.stage}>
                  <dt>{item.title}</dt>
                  <dd>
                    <strong>{actualStatusLabels[item.status]}</strong>
                    {item.evidence.map((text) => (
                      <p key={text}>{text}</p>
                    ))}
                    {item.application && (
                      <button onClick={() => open(item.stage)}>적용 기록 열기</button>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : hasActualRecords ? (
            <p className={system.quizFeedback}>
              아직 실제 목표 전체로 확인된 항목은 없어요. 직접 남긴 일부 결과와 이전 기록은 별도로
              볼 수 있어요.
            </p>
          ) : null}
          {actual.applications.filter(
            (item) => item.status !== "confirmed" || item.stage === "publish",
          ).length > 0 && (
            <section className={system.practiceStage} aria-label="직접 남긴 적용 결과">
              <h3>직접 남긴 적용 결과</h3>
              <dl className={system.recapPoints}>
                {actual.applications
                  .filter((item) => item.status !== "confirmed" || item.stage === "publish")
                  .map((item) => (
                    <div key={item.stage}>
                      <dt>{applicationStages[item.stage].name}</dt>
                      <dd>
                        <strong>
                          {item.status === "confirmed"
                            ? "기록한 범위 확인 · 본인 기록"
                            : actualStatusLabels[item.status]}
                        </strong>
                        <p>{item.result}</p>
                        <p>확인 근거: {item.evidence}</p>
                        <p>남긴 메모: {item.problem}</p>
                        {item.stage === "publish" && (
                          <p>기록한 범위의 결과예요. 공개·공유·재배포 전체 확인과는 구분해요.</p>
                        )}
                        <button onClick={() => open(item.stage)}>적용 기록 열기</button>
                      </dd>
                    </div>
                  ))}
              </dl>
            </section>
          )}
          {hasActualRecords && (
            <p className={system.aiKeyTakeaway}>
              {actual.complete
                ? "실제 공개·공유·수정 후 재배포까지 최종 프로젝트 확인 기록이 있어요."
                : "실제 공개·공유·수정 후 재배포를 포함한 최종 프로젝트 완료는 아직 확인되지 않았어요."}
            </p>
          )}
          {legacy.length > 0 && (
            <details className={system.preparationMore}>
              <summary>이전에 남긴 내 파일 기록</summary>
              <p>
                이전 본인 기록은 보존해요. 이 표시만으로 현재 실제 결과나 최종 공개 완료로 세지
                않아요.
              </p>
              <dl className={system.recapPoints}>
                {legacy.map((stage) => (
                  <div key={stage}>
                    <dt>{applicationStages[stage].name}</dt>
                    <dd>
                      {p.applications[stage].mode === "applied" && p.applications[stage].confirmed
                        ? "이전 양식의 본인 확인 기록"
                        : "이전 적용·대기 기록"}
                      <p>
                        {p.applications[stage].result ||
                          p.applications[stage].evidence ||
                          "별도 결과 문장 없음"}
                      </p>
                      {p.applications[stage].problem && (
                        <p>남긴 메모: {p.applications[stage].problem}</p>
                      )}
                      <button
                        disabled={!allLearned}
                        onClick={() => {
                          p.setReviewView(stage);
                          p.setScene(2);
                        }}
                      >
                        적용 기록 열기
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
          <details className={system.preparationMore}>
            <summary>기획·예시 화면과 첨부 자료 보기</summary>
            <p>기획 미리보기와 첨부 화면은 실제 파일 성공 여부를 자동으로 증명하지 않아요.</p>
            <WorkbookCompletionScreens stage="project" />
            <WorkbookCompletionScreens stage="experience" />
          </details>
        </section>
      )}
      {tab === "next" && (
        <section className={system.practiceStage} aria-label="아직 남은 일">
          <h2 className={system.screenTitle}>다음에는 무엇을 확인하면 될까요?</h2>
          {actual.remaining.length ? (
            <>
              {actual.changedPlan && (
                <p className={system.quizFeedback}>
                  현재 입력한 기획이 이전 작업 기준과 달라요. 이전 근거는 남기고 현재 결과를 다시
                  확인해요.
                </p>
              )}
              <table
                className={`${system.aiResultTable} ${system.aiCheckTable}`}
                aria-label="실제 결과 확인이 남은 범위"
              >
                <thead>
                  <tr>
                    <th scope="col">확인할 범위</th>
                    <th scope="col">현재 기록과 다음 확인</th>
                  </tr>
                </thead>
                <tbody>
                  {actual.remaining.map((item) => (
                    <tr key={item.stage}>
                      <th scope="row">{item.title}</th>
                      <td>
                        <strong>{actualStatusLabels[item.status]}</strong>
                        <br />
                        {item.task}
                        {item.application && (
                          <p>
                            {item.applicationStatus === "recheck" ? "이전 결과" : "기록한 결과"}:{" "}
                            {item.application.result}
                          </p>
                        )}
                        {item.evidence.length > 0 && (
                          <details className={system.preparationMore}>
                            <summary>보존한 확인 근거 보기</summary>
                            {item.evidence.map((text) => (
                              <p key={text}>{text}</p>
                            ))}
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={system.practiceActions}>
                <button disabled={!allLearned} onClick={() => open(actual.remaining[0].stage)}>
                  {actual.remaining[0].stage === "setup"
                    ? "첫 파일 확인으로"
                    : actual.remaining[0].stage === "project"
                      ? "첫 화면 확인으로"
                      : "다음 내 파일 적용 기록 열기"}{" "}
                  →
                </button>
              </div>
            </>
          ) : (
            <p className={system.quizFeedback}>
              {actual.complete
                ? "현재 프로젝트의 실제 목표 확인 기록이 모두 남아 있어요. 내용을 바꿨다면 영향받는 부분과 공개 주소를 다시 확인해요."
                : "실제 목표 확인 기록은 모두 남아 있어요. 전체 완료는 학습 기록과 함께 판단해요."}
            </p>
          )}
          <p className={system.recapScope}>
            실제 프로젝트 작업은 예시 학습과 별개예요. 추가 기록을 위해 기본 수업을 다시 완료할
            필요는 없어요.
          </p>
        </section>
      )}
    </section>
  );
}
