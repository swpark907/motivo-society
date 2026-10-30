"use client";

import { useEffect, useId, useRef, useState } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { workbookPlanFields } from "@/lib/workbook-page-plan";
import type { ProjectLessonProps, ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import {
  WorkbookFirstProjectResult,
  useRecordFirstProjectResult,
} from "./WorkbookFirstProjectResult";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "요청한 같은 파일을 열어요",
  "내 요청과 화면을 나란히 확인해요",
  "다른 부분이 있으면, 한 곳부터 고쳐요",
  "직접 확인한 내용을 남겨요",
  "내 기획이 화면으로 이어졌나요?",
];
const checkLabels = [
  "index.html만 바뀌었는지 확인했어요",
  "브라우저에서 내 제목·소개·내용을 확인했어요",
  "내용 보기 버튼이 목록으로 이동하는지 확인했어요",
];
const checkKeys = ["project.plan", "project.content", "project.actions"] as const;
const revisionExample =
  "my-first-web의 index.html에서 확인한 문제: [어느 부분이 어떻게 보이거나 동작하는지]. 기대한 결과: [원하는 내용이나 동작]. 이 부분만 고치고 나머지 제목·소개·내용과 버튼 동작은 유지해줘. index.html만 수정하고, 바뀐 부분과 다시 확인할 방법을 알려줘.";

export function WorkbookProjectResultLesson({
  record,
  ready,
  onChange,
  onBack,
  onComplete,
  onStep,
}: ProjectLessonProps) {
  const p = useWorkbookProgress();
  const recordResult = useRecordFirstProjectResult();
  const [screen, setScreen] = useWorkbookLessonState("project-result-screen", 0);
  const [revision, setRevision] = useWorkbookLessonState("project-result-revision", "");
  const [copyStatus, setCopyStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const computer = record.mode === "computer";
  const planReady = workbookPlanFields.every(([key]) => record[key].trim());
  const hasWork =
    planReady && Boolean(record.request.trim()) && (computer ? ready : record.mode === "example");
  const planApplied =
    p.projectWorkflow.changes.plan ===
    JSON.stringify(workbookPlanFields.map(([key]) => record[key]));
  const canFinish =
    hasWork && Boolean(record.observation.trim()) && (computer || record.previewConfirmed);
  const blocked =
    !hasWork ||
    (screen === 1 && !computer && !record.previewConfirmed) ||
    (screen >= 3 && !canFinish);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function update(patch: Partial<ProjectRecord>) {
    onChange({ ...record, ...patch });
  }
  function markCheck(index: number, checked: boolean) {
    update({ checks: record.checks.map((value, i) => (i === index ? checked : value)) });
    if (!checked)
      p.dispatchProjectWorkflow({
        type: "record",
        key: checkKeys[index],
        outcome: "attempted",
        evidence: record.observation,
        projectId: p.projectWorkflow.projectId,
        revision: p.projectWorkflow.checkpoints[checkKeys[index]].revision,
      });
  }
  async function copyRevision() {
    try {
      await navigator.clipboard.writeText(revision);
      setCopyStatus("수정 요청을 복사했어요. 같은 AI 대화에 붙여넣고 보내주세요.");
    } catch {
      setCopyStatus("복사하지 못했어요. 수정 요청을 직접 선택해 복사해주세요.");
    }
  }
  function finish() {
    recordResult(
      "project",
      computer,
      ready && record.checks.every(Boolean),
      record.observation,
      planApplied && planReady && Boolean(record.request.trim()),
    );
    p.dispatchProjectWorkflow({
      type: "learn",
      unit: "project",
      status: "confirmed",
      source: computer ? "computer" : "example",
    });
    if (!computer)
      p.setApplications((previous) =>
        previous.project.mode === null
          ? { ...previous, project: { ...previous.project, mode: "pending" } }
          : previous,
      );
    onComplete();
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="project"
        point={2}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={5}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>
          {!computer && screen === 0
            ? "내 기획을 화면으로 살펴봐요"
            : !computer && screen === 1
              ? "기획한 내용과 버튼을 확인해요"
              : titles[screen]}
        </h2>
        {!hasWork ? (
          <section className={system.practiceStage}>
            <p>
              먼저 2-2에서 제작 요청과 실습 방식을 준비해주세요. 기존 기획과 관찰 기록은 유지돼요.
            </p>
            <div className={system.practiceActions}>
              <button onClick={() => onStep(1)}>2-2 제작 요청으로</button>
            </div>
          </section>
        ) : (
          <>
            {screen === 0 && (
              <section className={system.practiceStage}>
                <p>
                  {computer ? (
                    <>
                      2-2에서 AI에 보낸 요청의 결과를 확인해요.{" "}
                      <strong>코드 답변보다 실제 파일과 화면</strong>을 살펴보세요.
                    </>
                  ) : (
                    <>
                      이번에는 <strong>기획 미리보기로 복습</strong>해요. 다음 화면에서
                      제목·소개·내용과 버튼을 살펴보세요.
                    </>
                  )}
                </p>
                {computer ? (
                  <ol className={system.decisionSteps}>
                    <li>
                      <strong>같은 파일 찾기</strong>
                      <span>AI 앱의 변경 목록과 my-first-web 폴더에서 index.html을 확인해요.</span>
                    </li>
                    <li>
                      <strong>브라우저로 열기</strong>
                      <span>
                        파일 탐색기(Windows)나 Finder(Mac)에서 열어요. 이미 열었다면 새로고침해요.
                      </span>
                    </li>
                  </ol>
                ) : (
                  <p className={system.aiKeyTakeaway}>
                    입력한 기획의 미리보기예요. 편집한 요청문은 반영되지 않아요.
                  </p>
                )}
                <details className={system.preparationMore}>
                  <summary>2-2에서 준비한 제작 요청 보기</summary>
                  <p style={{ whiteSpace: "pre-wrap" }}>{record.request}</p>
                </details>
                {computer && (
                  <details className={system.preparationMore}>
                    <summary>파일이 없거나 예전 화면이 보여요</summary>
                    <p>
                      같은 폴더의 파일인지 먼저 확인해요. 파일이 없다면 1-5 첫 파일 만들기부터
                      이어가세요. 열리지 않으면 ‘연결 프로그램’(Windows)·‘다음으로 열기’(Mac)에서
                      브라우저를 선택해요. 예전 화면이면 새로고침하고, 계속 다르면 파일 위치와
                      보이는 문제를 AI 앱에 알려주세요.
                    </p>
                  </details>
                )}
              </section>
            )}
            {screen === 1 && (
              <section className={system.practiceStage}>
                <p>
                  부탁한 글이 들어갔다면 독자 입장에서도 읽어보세요. 장소 소개의 ‘정말 좋아요’는
                  감상이지만, ‘창가 자리가 있고 평일 오후에는 조용했어요’는 선택을 도울 정보예요.{" "}
                  <strong>내가 좋아한 이유와 읽는 사람이 필요한 정보</strong>가 함께 보이나요?
                </p>
                {computer ? (
                  <>
                    <table
                      className={`${system.aiResultTable} ${system.aiCheckTable}`}
                      aria-label="제작 요청과 결과 확인"
                    >
                      <thead>
                        <tr>
                          <th scope="col">확인할 것</th>
                          <th scope="col">기획과 비교하기</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row">제목·내용</th>
                          <td>‘{record.title}’과 내가 적은 소개·목록이 보이나요?</td>
                        </tr>
                        <tr>
                          <th scope="row">목적·버튼</th>
                          <td>
                            ‘{record.purpose}’에 맞게 안내하나요? 내용 보기 버튼을 직접 눌러보세요.
                          </td>
                        </tr>
                        <tr>
                          <th scope="row">변경 범위</th>
                          <td>AI 앱의 변경 목록에서 index.html만 바뀌었나요?</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className={system.setupChecks}>
                      {checkLabels.map((label, index) => (
                        <label key={label}>
                          <input
                            type="checkbox"
                            checked={record.checks[index]}
                            onChange={(event) => markCheck(index, event.target.checked)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <small>
                      직접 확인한 것만 표시해요. 미확인 항목이 있어도 관찰을 남기고 학습을 계속할 수
                      있어요.
                    </small>
                  </>
                ) : (
                  <>
                    <p className={system.planningHint}>
                      읽을 사람: {record.audience}. 그 사람의 입장에서 내용 보기 버튼을 눌러보세요.
                    </p>
                    <div
                      className={`${system.preview} ${system.filePreview}`}
                      role="region"
                      aria-label="내 기획 구성 미리보기"
                    >
                      <h3>{record.title}</h3>
                      <p>{record.intro}</p>
                      <div className={system.practiceActions}>
                        <button
                          onClick={() => {
                            update({ previewConfirmed: true });
                            list.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
                          }}
                        >
                          내용 보기
                        </button>
                      </div>
                      <div ref={list}>
                        <h4>소개할 내용</h4>
                        <ul>
                          {record.content
                            .split("\n")
                            .filter((line) => line.trim())
                            .map((line, index) => (
                              <li key={index}>{line}</li>
                            ))}
                        </ul>
                      </div>
                    </div>
                    {record.previewConfirmed && (
                      <p className={system.planningHint} role="status">
                        목록으로 이동했어요. 제목과 내용이 기획에 맞는지 읽어봐요.
                      </p>
                    )}
                  </>
                )}
              </section>
            )}
            {screen === 2 && (
              <section className={system.practiceStage}>
                <p>
                  <strong>문제가 없다면 수정하지 않아도 괜찮아요.</strong> 다른 부분이 있다면 보인
                  현상과 원하는 결과를 구체적으로 알려주세요.
                </p>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="수정 요청 비교"
                >
                  <thead>
                    <tr>
                      <th scope="col">막연한 요청</th>
                      <th scope="col">확인한 현상을 담은 요청</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>버튼 좀 고쳐줘</td>
                      <td>
                        내용 보기 버튼을 눌러도 목록으로 이동하지 않아. 목록으로 이동하게 고치고
                        나머지 내용은 유지해줘.
                      </td>
                    </tr>
                  </tbody>
                </table>
                <details className={system.preparationMore}>
                  <summary>
                    {computer ? "수정 요청 작성·복사하기" : "수정 요청 쓰는 법 살펴보기"}
                  </summary>
                  <p>
                    예시의 문제가 내 화면에도 있을 때만 사용해요. 대괄호를 실제 관찰로 바꿔주세요.
                  </p>
                  <section className={system.learningGroup}>
                    <label className={system.practiceField} htmlFor={`${id}-revision`}>
                      내 수정 요청
                      <textarea
                        id={`${id}-revision`}
                        rows={5}
                        value={revision}
                        onChange={(event) => {
                          setRevision(event.target.value);
                          setCopyStatus("");
                        }}
                      />
                    </label>
                    <div className={system.practiceActions}>
                      <button
                        onClick={() => {
                          setRevision(revisionExample);
                          setCopyStatus("");
                        }}
                      >
                        {revision ? "수정 예시로 바꾸기" : "수정 예시 가져오기"}
                      </button>
                      {computer && (
                        <button disabled={!revision.trim()} onClick={() => void copyRevision()}>
                          수정 요청 복사하기
                        </button>
                      )}
                    </div>
                  </section>
                  {copyStatus && <p role="status">{copyStatus}</p>}
                </details>
                {computer ? (
                  <>
                    <p className={system.aiKeyTakeaway}>
                      같은 AI 대화에 전송 → 같은 파일 새로고침 →{" "}
                      <strong>내용과 버튼 다시 확인</strong>
                    </p>
                    <div className={system.practiceActions}>
                      <button
                        onClick={() => {
                          update({ checks: [false, false, false] });
                          p.dispatchProjectWorkflow({
                            type: "change",
                            values: {
                              content: `파일 변경 ${p.projectWorkflow.checkpoints["project.content"].revision + 1}`,
                            },
                          });
                          move(1);
                        }}
                      >
                        실제 파일을 수정했어요 · 재확인
                      </button>
                    </div>
                    <small>
                      실제 파일을 바꿨을 때 눌러요. 기존 관찰은 보존하고 확인 표시를 비워요.
                    </small>
                  </>
                ) : (
                  <p className={system.aiKeyTakeaway}>
                    미리보기는 수정 요청으로 바뀌지 않아요. 실제 파일 실습에서는 고친 뒤 같은 화면을
                    다시 열어 확인해요.
                  </p>
                )}
              </section>
            )}
            {screen === 3 && (
              <section className={system.practiceStage}>
                <p data-current-action tabIndex={-1}>
                  확인한 결과를 한 가지 적어주세요. 문제가 남았다면{" "}
                  <strong>어디에서 무엇이 달랐는지</strong> 남겨도 좋아요.
                </p>
                <label className={system.practiceField} htmlFor={`${id}-observation`}>
                  내 화면에서 확인한 점
                  <textarea
                    id={`${id}-observation`}
                    rows={5}
                    value={record.observation}
                    onChange={(event) => update({ observation: event.target.value })}
                    placeholder="예: 제목과 소개는 맞지만, 내용 보기 버튼을 눌러도 목록으로 이동하지 않아요."
                  />
                </label>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>기획의 목적</dt>
                    <dd>{record.purpose}</dd>
                  </div>
                  <div>
                    <dt>확인 범위</dt>
                    <dd>
                      {computer
                        ? `${record.checks.filter(Boolean).length} / 3개 직접 확인`
                        : "기획 미리보기 복습 · 실제 파일 제작 별도"}
                    </dd>
                  </div>
                </dl>
              </section>
            )}
            {screen === 4 && (
              <>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>이번에 한 일</dt>
                    <dd>
                      {computer ? "제작 요청과 실제 화면 비교" : "기획의 화면 구성과 버튼 살펴보기"}
                    </dd>
                  </div>
                  <div>
                    <dt>남긴 관찰</dt>
                    <dd>{record.observation}</dd>
                  </div>
                </dl>
                <WorkbookFirstProjectResult
                  stage="project"
                  computer={computer}
                  checksReady={ready && record.checks.every(Boolean)}
                  evidence={record.observation}
                  planReady={planApplied && planReady && Boolean(record.request.trim())}
                  className={system.quizFeedback}
                  confirmationMessage="아래 ‘기록하고 계속하기’를 누르면 체크와 관찰을 실제 파일의 본인 확인으로 함께 저장해요."
                />
                <section className={system.nextLesson}>
                  <small>다음 단원 · 반응형 화면 만들기</small>
                  <h3>{workbookLessonLabel("experience", 0)}</h3>
                  <p>같은 페이지를 PC와 모바일 폭에서 살펴봐요.</p>
                </section>
              </>
            )}
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>요청한 결과를 내 눈으로</h2>
          <p>내용과 버튼을 확인하고, 필요한 수정 뒤 다시 살펴봐요.</p>
          <small>미확인 결과는 대기로 기록해요.</small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen === 3} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            <button onClick={() => (screen > 0 ? move(screen - 1) : onStep(1))}>
              {screen > 0 ? "이전 설명" : "2-2 제작 요청으로"}
            </button>
          </WorkbookLessonPrevious>
          {screen < 4 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={!canFinish} onClick={finish}>
              2단원 마치고 다음 학습 보기 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}
