"use client";

import { useEffect, useId, useRef, useState } from "react";
import { workbookLessonLabel } from "@/lib/workbook-course";
import { experienceProgress, makeExperienceRequest } from "@/lib/workbook-experience";
import type { ExperienceLessonProps } from "./WorkbookExperienceLesson";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { WorkbookPracticalLab } from "./WorkbookPracticalLab";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const titles = [
  "관찰한 문제를 한 부분의 요청으로",
  "바꿀 것과 유지할 것을 분명하게",
  "요청 작성과 화면 변경은 별개예요",
  "다음은 요청한 변화 확인하기",
];

export function WorkbookImprovementRequestLesson({
  record,
  onChange,
  onBack,
  onStep,
}: ExperienceLessonProps) {
  const [screen, setScreen] = useWorkbookLessonState("improvement-request-screen", 0);
  const [basis, setBasis] = useWorkbookLessonState(
    "improvement-request-observation",
    record.request ? record.observation : "",
  );
  const [copyStatus, setCopyStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const id = useId();
  const observed = experienceProgress(record).observed;
  const stale = Boolean(record.request && basis && basis !== record.observation);
  const blocked = !observed || !record.request.trim();
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [screen]);
  function move(next: number) {
    setScreen(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function updateRequest(request: string) {
    setBasis(record.observation);
    setCopyStatus("");
    if (request === record.request) return;
    onChange({ ...record, request, applied: false, after: [false, false], buttonChecked: false });
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(record.request);
      setCopyStatus("요청을 복사했어요. 실제 파일에는 연습 조건을 내 관찰로 바꾼 뒤 사용해주세요.");
    } catch {
      setCopyStatus("복사하지 못했어요. 이전 설명의 요청을 직접 선택해 복사해주세요.");
    }
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="experience"
        point={1}
        headingRef={heading}
        onBack={onBack}
        current={screen + 1}
        total={4}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{titles[screen]}</h2>
        {!observed ? (
          <section className={system.practiceStage}>
            <p>먼저 3-1에서 두 폭을 비교하고 관찰을 남겨주세요. 기존 요청과 기록은 유지돼요.</p>
            <div className={system.practiceActions}>
              <button onClick={() => onStep(0)}>3-1 관찰로 돌아가기</button>
            </div>
          </section>
        ) : (
          <>
            {screen <= 1 && stale && (
              <p className={system.quizFeedback} role="status">
                <strong>관찰이 바뀌었어요.</strong> 편집한 요청은 그대로 남겼어요. 달라진 현상을
                요청에도 맞춰주세요.
              </p>
            )}
            {screen === 0 && (
              <section className={system.practiceStage}>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>3-1의 관찰</dt>
                    <dd>{record.observation}</dd>
                  </div>
                </dl>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="관찰에서 개선 요청으로"
                >
                  <thead>
                    <tr>
                      <th scope="col">요청에 담을 것</th>
                      <th scope="col">이번 연습에서</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">본 현상</th>
                      <td>위 관찰처럼, 어느 폭에서 무엇이 불편했는지</td>
                    </tr>
                    <tr>
                      <th scope="row">바꿀 부분</th>
                      <td>화면 안에 들어오도록 페이지 너비만</td>
                    </tr>
                    <tr>
                      <th scope="row">유지할 내용</th>
                      <td>제목·소개·목록과 내용 보기 버튼의 이동</td>
                    </tr>
                    <tr>
                      <th scope="row">재확인</th>
                      <td>두 폭에서 읽히는지, 버튼이 같은 목록으로 이동하는지</td>
                    </tr>
                  </tbody>
                </table>
                <div className={system.practiceActions}>
                  <button onClick={() => updateRequest(makeExperienceRequest(record.observation))}>
                    {record.request
                      ? "현재 관찰로 수정 요청 초안 바꾸기"
                      : "관찰한 점으로 수정 요청 초안 만들기"}
                  </button>
                </div>
                <p className={system.planningHint}>
                  {record.request
                    ? "다시 만들면 직접 편집한 요청도 현재 관찰의 초안으로 교체돼요. 기존 요청으로 계속해도 괜찮아요."
                    : "내 관찰을 준비된 요청 틀에 넣어요. AI를 호출하거나 파일을 바꾸지는 않아요."}
                </p>
              </section>
            )}
            {screen === 1 && (
              <section className={system.practiceStage}>
                <p data-current-action tabIndex={-1}>
                  관찰한 현상과 요청이 맞는지 읽어보세요.{" "}
                  <strong>이미 맞으면 억지로 수정하지 않아도 돼요.</strong>
                </p>
                <p>
                  ‘답답해요’는 ‘장소 설명 사이 간격이 좁아 항목을 구분하기 어려워요’로, ‘버튼이
                  이상해요’는 ‘확인만 적혀 있어 무엇을 여는지 모르겠어요’로 풀어볼 수 있어요. 전문
                  용어 대신 <strong>어디에서 무엇을 하려다 불편했는지</strong> 설명해보세요. 이번
                  연습에서는 앞에서 관찰한 목록의 잘림과 페이지 너비에 집중합니다.
                </p>
                <label className={system.practiceField} htmlFor={`${id}-request`}>
                  연습 화면의 개선 요청
                  <textarea
                    id={`${id}-request`}
                    rows={8}
                    value={record.request}
                    onChange={(event) => updateRequest(event.target.value)}
                  />
                </label>
                <details className={system.preparationMore}>
                  <summary>요청을 더 구체적으로 쓰려면</summary>
                  <p>
                    ‘모바일이 이상해’ 대신 ‘모바일 폭에서 목록 오른쪽이 잘려’처럼 현상을 적어요.
                    ‘전체를 새로 만들어’ 대신 너비 한 부분만 바꾸고 나머지는 유지하도록 요청해요.
                  </p>
                </details>
              </section>
            )}
            {screen === 2 && (
              <section className={system.practiceStage}>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>지금 준비한 것</dt>
                    <dd>관찰을 담은 개선 요청 문장</dd>
                  </div>
                  <div>
                    <dt>다음 기본 학습</dt>
                    <dd>준비된 너비 수정 예시에서 전후 비교</dd>
                  </div>
                </dl>
                <p className={system.aiKeyTakeaway}>
                  다음 예시는 <strong>페이지 너비가 화면에 맞게 바뀌는 모습</strong>을 보여줘요.
                  입력한 요청을 AI가 실행한 결과는 아니에요.
                </p>
                <details className={system.preparationMore}>
                  <summary>선택 · 내 파일에 요청을 사용하려면</summary>
                  <p>
                    280px·560px는 연습 조건이에요. 같은 index.html을 직접 살펴보고 실제 화면 폭과
                    문제로 바꾼 뒤, 준비한 AI 앱의 같은 작업 대화에 보내세요. 문제가 없다면 고칠
                    필요가 없어요.
                  </p>
                  <p>
                    파일이 바뀌면 브라우저를 새로고침하고 두 폭과 버튼을 다시 확인해요. 여기서는
                    자동 전송·파일 수정을 하지 않아요.
                  </p>
                  <div className={system.practiceActions}>
                    <button onClick={() => void copy()}>개선 요청 복사하기</button>
                  </div>
                  {copyStatus && <p role="status">{copyStatus}</p>}
                </details>
                <WorkbookPracticalLab stage="experience" />
              </section>
            )}
            {screen === 3 && (
              <>
                <dl className={system.recapPoints}>
                  <div>
                    <dt>출발한 관찰</dt>
                    <dd>{record.observation}</dd>
                  </div>
                  <div>
                    <dt>요청의 핵심</dt>
                    <dd>현상을 구체적으로, 바꿀 범위는 작게, 유지할 내용과 재확인까지</dd>
                  </div>
                </dl>
                <details className={system.preparationMore}>
                  <summary>내 개선 요청 다시 읽기</summary>
                  <p style={{ whiteSpace: "pre-wrap" }}>{record.request}</p>
                </details>
                <section className={system.nextLesson}>
                  <small>다음 수업</small>
                  <h3>{workbookLessonLabel("experience", 2)}</h3>
                  <p>너비 수정 예시에서 두 화면과 내용 보기 버튼을 비교해요.</p>
                </section>
                <p className={system.recapScope}>
                  요청을 준비한 것과 실제 파일이 바뀐 것은 구분해서 기록해요.
                </p>
              </>
            )}
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>한 부분을 구체적으로 요청</h2>
          <p>본 현상을 설명하고, 바꿀 부분과 유지할 내용을 나눠요.</p>
          <small>코드보다 원하는 결과를 분명하게</small>
        </div>
        <WorkbookActionReturn body={body} enabled={screen === 1} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen + 1}>
            <button onClick={() => (screen > 0 ? move(screen - 1) : onStep(0))}>
              {screen > 0 ? "이전 설명" : "3-1 관찰로"}
            </button>
          </WorkbookLessonPrevious>
          {screen < 3 ? (
            <button disabled={blocked} onClick={() => move(screen + 1)}>
              다음으로
            </button>
          ) : (
            <button disabled={blocked} onClick={() => onStep(2)}>
              수정 전후 확인으로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}
