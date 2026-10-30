"use client";

import { useEffect, useId, useRef, useState } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { makeWorkbookPageRequest, workbookPlanFields } from "@/lib/workbook-page-plan";
import type { ProjectLessonProps, ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookPlanRequestBridge } from "./WorkbookLessonInteractions";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { WorkbookPracticalLab } from "./WorkbookPracticalLab";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "내 기획을 같은 파일의 제작 요청으로",
  "요청을 읽고, 필요한 부분만 다듬어요",
  "어디서 결과를 확인할까요?",
  "준비한 요청을 다음 작업으로 이어가요",
  "다음은 바뀐 화면을 확인할 차례예요",
];

export function WorkbookProjectRequestLesson({
  record,
  ready,
  onChange,
  onBack,
  onStep,
}: ProjectLessonProps) {
  const p = useWorkbookProgress();
  const [screen, setScreen] = useWorkbookLessonState("project-request-screen", 0);
  const [copyStatus, setCopyStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const planReady = workbookPlanFields.every(([key]) => record[key].trim());
  const draft = makeWorkbookPageRequest(record);
  const stale = Boolean(record.request) && record.basedOn !== draft;
  const computer = record.mode === "computer";
  const modeReady = computer ? ready : record.mode === "example";
  const planBasis = JSON.stringify(workbookPlanFields.map(([key]) => record[key]));
  const blocked = !planReady || !record.request.trim() || (screen >= 2 && !modeReady);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function update(patch: Partial<ProjectRecord>) {
    if (Object.entries(patch).every(([key, value]) => record[key as keyof ProjectRecord] === value))
      return;
    setCopyStatus("");
    onChange({ ...record, ...patch, checks: [false, false, false], previewConfirmed: false });
  }
  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(record.request);
      setCopyStatus("제작 요청을 복사했어요. AI 앱에 붙여넣고 보내주세요.");
    } catch {
      setCopyStatus("복사하지 못했어요. 이전 설명의 ‘내 제작 요청’을 직접 선택해 복사해주세요.");
    }
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="project"
        point={1}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={5}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[screen]}</h2>
        {screen <= 1 && stale && (
          <p className={system.quizFeedback} role="status">
            <strong>기획이 바뀌었어요.</strong> 편집한 요청은 그대로 남겼어요. 변경한 제목·내용을
            요청에도 맞춰주세요.
          </p>
        )}
        {screen === 0 && (
          <section className={system.practiceStage}>
            <p>
              2-1에서 정한 기획을 요청 틀에 넣어요. <strong>my-first-web/index.html</strong>을
              이어서 고칠 거예요.
            </p>
            <dl className={system.recapPoints} data-testid="workbook-plan-request-bridge">
              <div>
                <dt>제목</dt>
                <dd>{record.title || "아직 입력하지 않았어요"}</dd>
              </div>
              <div>
                <dt>읽을 사람</dt>
                <dd>{record.audience || "아직 입력하지 않았어요"}</dd>
              </div>
              <div>
                <dt>바라는 행동</dt>
                <dd>{record.purpose || "아직 입력하지 않았어요"}</dd>
              </div>
            </dl>
            <details className={system.preparationMore}>
              <summary>이어받을 소개와 내용 보기</summary>
              <p>{record.intro}</p>
              <ul>
                {record.content
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
              </ul>
            </details>
            <div className={system.practiceActions}>
              <button
                disabled={!planReady}
                onClick={() => {
                  p.dispatchProjectWorkflow({ type: "change", values: { plan: planBasis } });
                  update({ request: draft, basedOn: draft });
                }}
              >
                {record.request ? "현재 기획으로 요청 초안 바꾸기" : "내 기획으로 요청 초안 만들기"}
              </button>
            </div>
            <p className={system.planningHint}>
              {!planReady
                ? "기획의 빈 항목을 먼저 채워주세요. 2-1 홈페이지 기획하기에서 이어서 작성할 수 있어요."
                : record.request
                  ? "초안을 다시 만들면 직접 편집한 요청도 현재 기획의 초안으로 교체돼요."
                  : "입력한 기획을 요청 문장으로 옮겨요. 다음 화면에서 연결된 부분을 살펴봐요."}
            </p>
          </section>
        )}
        {screen === 1 && (
          <section className={system.practiceStage}>
            <p data-current-action tabIndex={-1}>
              기획 항목을 눌러 현재 요청과 비교해보세요. <strong>아래 원문은 직접 편집</strong>할 수
              있어요.
            </p>
            <WorkbookPlanRequestBridge plan={record} request={record.request} />
            <label className={system.practiceField} htmlFor={`${id}-request`}>
              내 제작 요청
              <textarea
                id={`${id}-request`}
                rows={3}
                value={record.request}
                onChange={(event) => update({ request: event.target.value })}
              />
            </label>
          </section>
        )}
        {screen === 2 && (
          <section className={system.practiceStage}>
            <p>지금 가능한 실습 방식 하나를 골라주세요.</p>
            <div className={system.choices} aria-label="실습 방식 선택">
              <button
                className={system.choice}
                disabled={!ready}
                aria-pressed={computer}
                onClick={() => update({ mode: "computer" })}
              >
                <span>
                  <strong>내 파일로 제작 실습하기</strong>
                  <br />
                  준비한 AI 앱에 요청하고, 같은 파일의 결과를 확인해요.
                </span>
              </button>
              <button
                className={system.choice}
                aria-pressed={record.mode === "example"}
                onClick={() => update({ mode: "example" })}
              >
                <span>
                  <strong>기획 미리보기로 복습하기</strong>
                  <br />
                  입력한 기획을 화면 구성으로 살펴봐요. 실제 파일 제작은 별도예요.
                </span>
              </button>
            </div>
            {!ready && (
              <p className={system.planningHint}>
                내 파일 실습은 1-3 도구 준비 확인 후 이용해요. 파일이 없다면 1-5 첫 파일 만들기부터
                이어가세요.
              </p>
            )}
          </section>
        )}
        {screen === 3 && (
          <section className={system.practiceStage}>
            {computer ? (
              <>
                <h3>복사 → AI 앱에 보내기 → 워크북으로 돌아오기</h3>
                <ol>
                  <li>아래 버튼으로 제작 요청을 복사해요.</li>
                  <li>
                    AI 앱에서 <strong>my-first-web을 작업하던 같은 대화</strong>를 열어 붙여넣고
                    보내요. Windows는 Ctrl+V, Mac은 Command+V예요.
                  </li>
                  <li>작업이 끝나면 바뀐 파일과 안내를 읽고 이 워크북으로 돌아와요.</li>
                </ol>
                <div className={system.practiceActions}>
                  <button onClick={() => void copyRequest()}>제작 요청 복사하기</button>
                </div>
                {copyStatus && <p role="status">{copyStatus}</p>}
                <p className={system.aiKeyTakeaway}>
                  복사만으로 AI에 전송되지는 않아요. <strong>AI 앱에서 직접 보내주세요.</strong>
                </p>
                <details className={system.preparationMore}>
                  <summary>index.html이 없다고 해요</summary>
                  <p>
                    1-5에서 첫 파일을 만든 뒤 이어가세요. 이번 요청은 새 폴더를 만드는 대신 같은
                    파일을 고치기 위한 요청이에요.
                  </p>
                </details>
              </>
            ) : (
              <>
                <h3>다음 수업에서 내 기획을 미리 봐요</h3>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>보이는 것</dt>
                    <dd>기획에 적은 제목·소개·내용과 ‘내용 보기’ 버튼</dd>
                  </div>
                  <div>
                    <dt>확인할 것</dt>
                    <dd>주제가 보이는지, 목록으로 이동할 수 있는지</dd>
                  </div>
                </dl>
                <p className={system.aiKeyTakeaway}>
                  입력한 기획을 배치한 예시예요.{" "}
                  <strong>AI 응답이나 실제 파일 제작 결과가 아니에요.</strong> 편집한 요청문은
                  미리보기에 자동 반영되지 않아요.
                </p>
              </>
            )}
          </section>
        )}
        {screen === 4 && (
          <>
            <dl className={system.recapPoints}>
              <div>
                <dt>준비한 것</dt>
                <dd>내 기획을 담은 제작 요청</dd>
              </div>
              <div>
                <dt>이번 방식</dt>
                <dd>{computer ? "AI 앱에서 같은 파일 수정" : "기획 미리보기로 복습"}</dd>
              </div>
              <div>
                <dt>다음 확인</dt>
                <dd>제목·소개·내용, 내용 보기 버튼의 동작</dd>
              </div>
            </dl>
            <section className={system.nextLesson}>
              <small>다음 수업</small>
              <h3>{workbookLessonLabel("project", 2)}</h3>
              <p>
                {computer
                  ? "같은 index.html을 브라우저로 열어 요청대로 바뀌었는지 확인해요."
                  : "기획의 화면 구성을 살펴보고 확인한 점을 남겨요."}
              </p>
            </section>
            <WorkbookPracticalLab stage="project" />
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>기획을 실행할 요청으로</h2>
          <p>같은 파일에 담을 내용과 바꿀 범위를 분명하게 전달해요.</p>
          <small>요청 작성과 실제 파일 변경은 별개예요.</small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen === 1} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            <button
              data-action-role="lesson-back"
              onClick={() => (screen > 0 ? move(screen - 1) : onStep(0))}
            >
              {screen > 0 ? "이전 설명" : "2-1 기획으로"}
            </button>
          </WorkbookLessonPrevious>
          {screen < 4 ? (
            <button
              data-action-role={"lesson-next"}
              disabled={blocked}
              onClick={() => move(screen + 1)}
            >
              다음으로
            </button>
          ) : (
            <button
              data-action-role={"lesson-next"}
              disabled={blocked}
              onClick={() => {
                if (p.projectWorkflow.changes.plan !== planBasis)
                  p.dispatchProjectWorkflow({ type: "change", values: { plan: planBasis } });
                onStep(2);
              }}
            >
              첫 화면 확인하기로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}
