"use client";

// 실제 도구를 실행하지 않고 학습자가 확인한 결과만 방문 상태에 남긴다.
import { useId, useState } from "react";
import {
  applicationStages,
  applicationStatus,
  type ApplicationRecord,
  type ApplicationStage,
} from "@/lib/workbook-application";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookLesson.module.scss";
import { applicationResultStatus, saveApplicationResult } from "@/lib/workbook-application-result";
import { WorkbookApplicationGuide } from "./WorkbookApplicationGuide";

export function WorkbookApplicationRecord({
  stage,
  standalone = false,
}: {
  stage: ApplicationStage;
  standalone?: boolean;
}) {
  const { project, projectWorkflow, applications, setApplications } = useWorkbookProgress();
  const plan = JSON.stringify([
    project.title,
    project.audience,
    project.purpose,
    project.intro,
    project.content,
  ]);
  const connected = stage !== "project";
  const resultStatus = connected
    ? applicationResultStatus(projectWorkflow, stage, plan, applications)
    : null;
  function save(outcome: "confirmed" | "waiting") {
    setApplications((previous) => ({
      ...previous,
      [stage]:
        stage === "project"
          ? { ...previous[stage], confirmed: true }
          : saveApplicationResult(projectWorkflow, stage, plan, previous, outcome),
    }));
  }
  const record = applications[stage];
  const id = useId();
  const [copyStatus, setCopyStatus] = useState("");
  const info = applicationStages[stage];
  const Heading = standalone ? "h2" : "h3";
  function patch(value: Partial<ApplicationRecord>) {
    if ("request" in value) setCopyStatus("");
    setApplications((previous) => {
      if (
        Object.entries(value).every(
          ([key, next]) => previous[stage][key as keyof ApplicationRecord] === next,
        )
      )
        return previous;
      return { ...previous, [stage]: { ...previous[stage], ...value, confirmed: false } };
    });
  }
  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(record.request);
      setCopyStatus("실습 요청을 복사했어요. AI 앱의 같은 작업에 붙여넣고 보내주세요.");
    } catch {
      setCopyStatus("복사하지 못했어요. 위 요청을 직접 선택해 복사할 수 있어요.");
    }
  }
  return (
    <section className={styles.practiceStage} aria-label="내 프로젝트 적용 기록">
      <Heading className={standalone ? styles.screenTitle : undefined}>
        내 프로젝트 적용 기록 · 선택
      </Heading>
      <p>
        앞의 예시를 마친 것과 <strong>내 파일에 적용한 결과</strong>는 따로 기록해요. 아직 실습하지
        않아도 예시 학습을 마치고 다음으로 갈 수 있어요.
      </p>
      <dl className={styles.recapPoints}>
        <div>
          <dt>내 페이지</dt>
          <dd>{project.title || "아직 정한 제목이 없어요"}</dd>
        </div>
        <div>
          <dt>내 목적</dt>
          <dd>{project.purpose || "아직 정한 목적이 없어요"}</dd>
        </div>
      </dl>
      <p>
        {info.task}해요. 컴퓨터에서 직접 확인한 결과만 적어요. 모바일에서 이 기록을 작성하는 것
        자체가 실습 완료를 뜻하지 않아요.
      </p>
      <details className={styles.preparationMore}>
        <summary>내 파일 실습 안내 펼치기</summary>
        <WorkbookApplicationGuide stage={stage} />
      </details>
      <div className={styles.choices} role="group" aria-label="적용 기록 방식">
        <button
          className={styles.choice}
          aria-pressed={record.mode === "pending"}
          onClick={() => record.mode !== "pending" && patch({ mode: "pending" })}
        >
          아직 직접 적용하지 않았어요
        </button>
        <button
          className={styles.choice}
          aria-pressed={record.mode === "applied"}
          onClick={() => record.mode !== "applied" && patch({ mode: "applied" })}
        >
          내 파일에 적용한 결과 적기
        </button>
      </div>
      {record.mode !== "applied" && (
        <p className={styles.quizFeedback} role="status">
          {info.name} ·{" "}
          {resultStatus === "recheck" ? "변경 후 재확인 필요" : applicationStatus(record)}
        </p>
      )}
      {record.mode !== "applied" && (
        <p>
          예시 기록만으로 실제 제작·저장 연결·공개가 끝났다고 표시하지 않아요. 아래 초안을 가져가
          직접 확인한 뒤 돌아와 적을 수 있어요.
        </p>
      )}
      <section className={styles.practiceStage} aria-label="실습 요청 작성">
        <h3>내 파일에 보낼 요청</h3>
        <div className={styles.practiceActions}>
          <button
            onClick={() =>
              patch({
                request: `내 홈페이지의 목적: ${project.purpose}\n읽을 사람: ${project.audience}\n제목: ${project.title}\n소개: ${project.intro}\n보여줄 내용: ${project.content}\n\n이번 작업: ${info.task}해줘. 작업 전 필요한 파일과 변경 범위를 알려줘. 내 목적과 내용을 유지하고 부탁한 파일만 바꿔줘.\n${record.problem.trim() ? `직접 확인한 문제: ${record.problem.trim()}\n` : ""}실행한 뒤 화면과 버튼이 원하는 대로 나오는지 확인할 방법을 알려줘. 공개·계정 생성·외부 저장 연결은 이 요청으로 실행하지 마.`,
              })
            }
          >
            내 기획으로 실습 요청 초안 만들기
          </button>
        </div>
        {record.request.trim() && (
          <p>다시 누르면 직접 다듬은 요청도 현재 기획의 초안으로 바뀌어요.</p>
        )}
        <div className={styles.practiceField}>
          <label htmlFor={`${id}-request`}>내 프로젝트 실습·수정 요청</label>
          <textarea
            id={`${id}-request`}
            rows={5}
            value={record.request}
            onChange={(e) => patch({ request: e.target.value })}
            placeholder="초안을 내 파일과 확인할 동작에 맞게 고쳐요. AI에 자동 전송되지 않아요."
          />
        </div>
        {record.request.trim() && (
          <section className={styles.practiceStage} aria-label="내 파일로 이어가기">
            <p>
              <strong>여기부터는 내 컴퓨터의 파일에서 하는 선택 실습이에요.</strong> 워크북의 예시
              수정·저장·접속 버튼은 내 파일을 바꾸지 않아요.
            </p>
            <ol className={styles.decisionSteps}>
              <li>
                <span>
                  위 요청을 내 파일의 실제 문제에 맞게 고치고 복사해요. 예시에서 쓴 크기·버튼 이름을
                  그대로 적용하지 않아요.
                </span>
              </li>
              <li>
                <span>
                  AI 앱에서 내 index.html이 있는 같은 작업 폴더의 대화를 열어요. Windows는 Ctrl+V,
                  Mac은 Command+V로 붙여넣고 보내요. 복사만으로 전송되지는 않아요.
                </span>
              </li>
              <li>
                <span>
                  {stage === "publish"
                    ? "공개 전이라면 내 파일에서 내용과 버튼을 점검해요. 이미 공개했다면 실제 주소를 다른 기기에서도 열어 확인해요."
                    : "파일을 브라우저로 다시 열거나 새로고침하고 요청한 화면·동작을 확인해요."}{" "}
                  이 워크북으로 돌아와 ‘내 파일에 적용한 결과 적기’에 직접 본 결과를 남겨요.
                </span>
              </li>
            </ol>
            <div className={styles.practiceActions}>
              <button onClick={() => void copyRequest()}>내 파일 실습 요청 복사하기</button>
            </div>
            {copyStatus && (
              <p className={styles.quizFeedback} role="status">
                {copyStatus}
              </p>
            )}
          </section>
        )}
      </section>
      {record.mode === "applied" && (
        <section className={styles.practiceStage} aria-label="직접 확인한 결과 기록">
          <h3>내 파일에서 직접 확인한 결과</h3>
          <p>
            주소·파일명은 <strong>텍스트로만 기록</strong>해요. 이 앱이 열거나 업로드하지 않으며,
            주소를 적었다고 공개 성공으로 판단하지 않아요. 비밀번호·비밀 키·개인정보는 적지 마세요.
          </p>
          {(
            [
              [
                "location",
                "확인한 파일명 또는 주소 (선택)",
                "예: my-first-web/index.html. 공개 주소가 없으면 적지 않아도 돼요.",
              ],
              [
                "result",
                "내 파일에서 확인한 결과",
                "예: 휴대폰 390px와 PC에서 제목과 목록이 잘리지 않고 버튼이 목록으로 이동해요.",
              ],
              [
                "problem",
                "남은 문제 또는 문제없음",
                "예: 긴 링크가 화면 밖으로 나가요. 또는 확인한 범위에서 문제를 찾지 못했어요.",
              ],
              [
                "evidence",
                "직접 다시 확인한 근거",
                "예: index.html만 바뀐 것을 확인하고 브라우저를 새로 연 뒤 같은 버튼을 눌러 목록이 보이는지 다시 확인했어요.",
              ],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div className={styles.practiceField} key={key}>
              <label htmlFor={`${id}-${key}`}>{label}</label>
              <textarea
                id={`${id}-${key}`}
                value={record[key]}
                onChange={(e) => patch({ [key]: e.target.value })}
                placeholder={placeholder}
              />
            </div>
          ))}
          <p>
            결과·남은 문제·다시 확인한 근거를 모두 적으면 아래 버튼을 누를 수 있어요. 문제가
            없었다면 확인한 범위에서 문제를 찾지 못했다고 적어요.
          </p>
          <div className={styles.practiceActions}>
            <button
              disabled={!record.result.trim() || !record.problem.trim() || !record.evidence.trim()}
              onClick={() => save("confirmed")}
            >
              {connected ? "확인한 범위 충족으로 기록하기" : "직접 확인한 결과로 기록하기"}
            </button>
            {connected && (
              <button
                disabled={
                  !record.result.trim() || !record.problem.trim() || !record.evidence.trim()
                }
                onClick={() => save("waiting")}
              >
                남은 문제가 있는 결과로 기록하기
              </button>
            )}
          </div>
          {connected && (
            <p>
              기록한 범위를 직접 확인했다면 충족으로, 해결할 문제가 남았다면 남은 문제로 기록해요.
              마지막 학습 정리의 실제 결과와 남은 일에 반영돼요.
              {stage === "publish" &&
                " 이 적용 기록만으로 공개·공유·재배포 전체를 완료 처리하지 않아요."}
            </p>
          )}
          {resultStatus === "recheck" && (
            <p className={styles.quizFeedback} role="status">
              기록이나 작업 기준이 바뀌었어요. 이전 확인은 보존하고 현재 결과를 다시 확인해요.
            </p>
          )}
          <p className={styles.quizFeedback} role="status">
            {info.name} ·{" "}
            {resultStatus === "recheck" ? "변경 후 재확인 필요" : applicationStatus(record)}
          </p>
          <p>
            이 표시는 <strong>본인이 확인한 기록</strong>이에요. 앱의 자동 검증이나 공개·저장 성공
            인증이 아니에요. 내용을 바꾸면 다시 확인 전으로 표시해요.
          </p>
        </section>
      )}
      <p className={styles.recapScope}>
        이번 방문 동안만 유지해요. 새로고침하면 초기화되며 회원별 서버 저장은 아직 연결하지
        않았어요.
      </p>
    </section>
  );
}

export function WorkbookApplicationSummary() {
  const { applications } = useWorkbookProgress();
  return (
    <section aria-label="내 프로젝트 적용 상태">
      <h3>예시 학습과 내 프로젝트 적용은 따로 봐요</h3>
      <p>아래는 직접 적용 여부의 본인 기록이에요. 예시 완료로 바뀌지 않아요.</p>
      {(Object.keys(applicationStages) as ApplicationStage[]).map((stage) => {
        const record = applications[stage];
        return (
          <details key={stage}>
            <summary>
              {applicationStages[stage].name} · {applicationStatus(record)}
            </summary>
            <p>
              {record.mode !== "applied"
                ? "직접 적용 결과는 아직 기록하지 않았어요. 단원을 다시 열어 내 기획의 요청과 결과를 적을 수 있어요."
                : "본인 기록이며 자동 검증 결과가 아니에요."}
            </p>
            {(
              [
                ["location", "확인한 파일명 또는 주소"],
                ["result", "확인한 결과"],
                ["problem", "남은 문제"],
                ["request", "실습·수정 요청"],
                ["evidence", "다시 확인한 근거"],
              ] as const
            ).map(
              ([key, label]) =>
                record[key].trim() && (
                  <div key={key}>
                    <h4>{label}</h4>
                    <p>{record[key]}</p>
                  </div>
                ),
            )}
          </details>
        );
      })}
    </section>
  );
}
