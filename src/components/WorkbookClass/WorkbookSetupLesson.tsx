"use client";

import { workbookLessonLabel } from "@/lib/workbook-course";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";

// 준비 안내의 단계와 학습자 본인이 확인한 준비 상태를 유지한다. 외부 앱을 자동 검사하지 않는다.
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { useEffect, useRef } from "react";
import styles from "./WorkbookClass.module.scss";

export type SetupStatus = "ready" | "pending" | "review";
const statusLabels = {
  ready: "컴퓨터 준비 확인 · 본인 확인",
  pending: "설명 확인 · 컴퓨터 준비 필요",
  review: "복습 확인 · 컴퓨터 준비 필요",
};
export { statusLabels as setupStatusLabels };

import system from "./WorkbookLesson.module.scss";

const flow = "작업 폴더 → 요청 → 파일 변경 → 실행·확인 → 수정 요청";
const preparationChecks = [
  "앱에서 코드 에이전트를 사용할 수 있어요",
  "로컬 실습 폴더 my-first-web을 연결했어요",
  "요청 입력창과 작업 중지 방법을 확인했어요",
];
const titles = [
  ["앱과 실습 폴더를 준비해요", "이번 실습은 Codex로 안내해요", "어떻게 따라갈까요?"],
  ["내 컴퓨터에 맞는 앱을 설치해요", "로그인하고 Codex를 열어요", "막힌 단계부터 확인해요"],
  ["파일을 모아둘 폴더를 만들어요", "앱에 실습 폴더를 연결해요", "요청할 곳과 멈출 곳을 찾아요"],
];

export function WorkbookSetupLesson({
  initialStatus,
  onBack,
  onComplete,
}: {
  initialStatus: SetupStatus | null;
  onBack: () => void;
  onComplete: (status: SetupStatus) => void;
}) {
  const [step, setStep] = useWorkbookLessonState("setup-step", 0);
  const [parts, setParts] = useWorkbookLessonState<Record<number, number>>("setup-parts", {});
  const part = parts[step] ?? 0;
  const [os, setOs] = useWorkbookLessonState<"windows" | "mac">("setup-os", "windows");
  const [mode, setMode] = useWorkbookLessonState<"computer" | "review" | null>("setup-mode", null);
  const [answer, setAnswer] = useWorkbookLessonState<number | null>("setup-answer", null);
  const [checks, setChecks] = useWorkbookLessonState<boolean[]>("setup-checks", [
    false,
    false,
    false,
  ]);
  const [status, setStatus] = useWorkbookLessonState<SetupStatus | null>(
    "setup-status",
    initialStatus,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [step, part]);
  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  const canFinish = answer === 1 && mode !== null && status !== null;
  const screen = step < 3 ? step * 3 + part + 1 : step + 7;
  const title =
    step < 3
      ? titles[step][part]
      : [
          "",
          "",
          "",
          "도구가 달라도 작업 흐름은 같아요",
          "직접 확인한 준비 상태를 남겨요",
          "준비한 내용을 정리해요",
        ][step];
  const blocked =
    (step === 0 && part === 2 && mode === null) ||
    (step === 3 && answer !== 1) ||
    (step === 4 && status === null);
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="agent"
        point={2}
        headingRef={heading}
        onBack={onBack}
        current={screen}
        total={12}
      />
      <div ref={body} className={system.lessonBody} tabIndex={0} aria-label="수업 내용">
        <h2 className={system.screenTitle}>{title}</h2>
        {step === 0 && part === 0 && (
          <div className={system.aiConceptSlide}>
            <p>
              다음 수업에서 AI에게 요청하기 전에, <strong>앱·계정·실습 폴더</strong>를 준비해요.
            </p>
            <ol className={system.decisionSteps}>
              <li>
                <strong>앱 설치</strong>
                <span>내 컴퓨터에서 코드 에이전트를 열어요.</span>
              </li>
              <li>
                <strong>계정 확인</strong>
                <span>로그인하고 Codex 작업을 사용할 수 있는지 봐요.</span>
              </li>
              <li>
                <strong>실습 폴더 연결</strong>
                <span>AI가 파일을 만들고 고칠 공간을 정해요.</span>
              </li>
            </ol>
            <p className={system.aiKeyTakeaway}>
              이번에는 <strong>준비까지만</strong> 해요. 제작 요청은 뒤 수업에서 보내요.
            </p>
          </div>
        )}
        {step === 0 && part === 1 && (
          <div className={system.aiConceptSlide}>
            <p>
              기본 안내는 <strong>데스크톱 앱의 Codex</strong>예요. 웹 채팅에 로그인하는 것과 내
              컴퓨터의 파일 작업 준비는 달라요.
            </p>
            <section className={system.aiCodeNote}>
              <h3>앞으로 반복할 작업 흐름</h3>
              <p>{flow}</p>
              <p>
                요청은 AI에게 부탁한 내용이고, 파일은 만들어진 작업물이에요. 브라우저는 그 파일을
                화면으로 보는 앱입니다. 준비가 끝나면{" "}
                <strong>내 말이 파일과 화면으로 이어지는 과정</strong>을 경험하게 돼요.
              </p>
            </section>
            <p>
              이미 다른 코드 에이전트를 쓴다면 같은 흐름으로 따라와도 좋아요. 화면·기능·이용 조건은
              도구마다 달라요.
            </p>
          </div>
        )}
        {step === 0 && part === 2 && (
          <section className={system.exampleQuestion} aria-label="수강 방식 선택">
            <section className={system.learningGroup}>
              <p data-current-action tabIndex={-1}>
                지금 사용할 환경을 하나 골라주세요.
              </p>
              <div className={system.choices}>
                <button
                  className={system.choice}
                  aria-pressed={mode === "computer"}
                  onClick={() => {
                    setMode("computer");
                    setStatus(null);
                  }}
                >
                  컴퓨터에서 준비하기
                </button>
                <button
                  className={system.choice}
                  aria-pressed={mode === "review"}
                  onClick={() => {
                    setMode("review");
                    setStatus("review");
                    setChecks([false, false, false]);
                  }}
                >
                  모바일에서 복습하기
                </button>
              </div>
            </section>
            <p>
              컴퓨터에서는 실제 앱을 준비하고, 모바일에서는 설명과 확인 문제로 복습해요. 복습만으로
              컴퓨터 준비 완료를 기록하지 않아요.
            </p>
            {initialStatus && (
              <small>
                이전 기록: {statusLabels[initialStatus]}. 이번에 다시 확인해 바꿀 수 있어요.
              </small>
            )}
          </section>
        )}
        {step === 1 && part === 0 && (
          <div className={system.aiConceptSlide}>
            <div className={system.resultTabs} role="group" aria-label="설치 안내 OS">
              <button aria-pressed={os === "windows"} onClick={() => setOs("windows")}>
                Windows 안내
              </button>
              <button aria-pressed={os === "mac"} onClick={() => setOs("mac")}>
                Mac 안내
              </button>
            </div>
            <ol className={system.decisionSteps}>
              <li>
                <strong>공식 설치 안내 열기</strong>
                <span>
                  {os === "windows" ? "Windows" : "Mac"}용 앱과 지원 조건을 확인해요. OS는 컴퓨터의
                  운영체제예요.
                  <br />
                  <a
                    href={
                      os === "windows"
                        ? "https://learn.chatgpt.com/docs/windows/windows-app"
                        : "https://learn.chatgpt.com/docs/app"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    공식 데스크톱 설치 안내 ↗
                  </a>
                </span>
              </li>
              <li>
                <strong>앱 설치하기</strong>
                <span>
                  공식 페이지의 다운로드·설치 안내를 따라요.
                  {os === "mac" && " Mac은 지원하는 칩도 확인해요."}
                </span>
              </li>
              <li>
                <strong>설치한 앱 실행하기</strong>
                <span>{os === "windows" ? "시작 메뉴" : "응용 프로그램"}에서 앱을 열어요.</span>
              </li>
            </ol>

            <p className={system.aiKeyTakeaway}>
              공식 앱 이름은 <strong>ChatGPT desktop app</strong>으로 표시돼요. 앱 안에서 Codex를
              선택할 거예요.
            </p>
          </div>
        )}
        {step === 1 && part === 1 && (
          <div className={system.aiConceptSlide}>
            <ol className={system.decisionSteps}>
              <li>
                <strong>내 계정으로 로그인</strong>
                <span>앱을 열고 화면의 로그인 안내를 따라요.</span>
              </li>
              <li>
                <strong>Codex 선택</strong>
                <span>ChatGPT 선택 메뉴에서 Codex를 열어요.</span>
              </li>
              <li>
                <strong>새 대화 위치 확인</strong>
                <span>New chat(새 대화)을 찾아요. 아직 요청은 보내지 않아요.</span>
              </li>
            </ol>
            <p>
              내 계정에서 Codex를 사용할 수 있는지 확인해요. 이용 조건과 한도는 계정에 따라 달라요.
              이 단계에서 유료 플랜 구매를 요구하지 않아요.
            </p>
            <a
              href="https://learn.chatgpt.com/docs/environments/modes"
              target="_blank"
              rel="noreferrer"
            >
              Codex 작업 환경 안내 ↗
            </a>
            {" · "}
            <a href="https://learn.chatgpt.com/docs/pricing" target="_blank" rel="noreferrer">
              요금·사용량 안내 ↗
            </a>
          </div>
        )}
        {step === 1 && part === 2 && (
          <div className={system.aiConceptSlide}>
            <dl className={system.recapPoints}>
              <div>
                <dt>설치가 안 돼요</dt>
                <dd>공식 안내에서 운영체제와 기기 지원 조건을 다시 확인해요.</dd>
              </div>
              <div>
                <dt>로그인이 안 돼요</dt>
                <dd>앱에 표시된 계정·인증 안내를 따라요.</dd>
              </div>
              <div>
                <dt>Codex가 안 보여요</dt>
                <dd>작업 환경 안내와 내 계정의 이용 가능 여부를 확인해요.</dd>
              </div>
            </dl>
            <p className={system.aiKeyTakeaway}>
              아직 해결하지 못해도 설명은 계속 볼 수 있어요. 마지막에{" "}
              <strong>준비가 필요한 상태</strong>로 남겨요.
            </p>
          </div>
        )}
        {step === 2 && part === 0 && (
          <div className={system.aiConceptSlide}>
            <p>
              폴더는 관련 파일을 모아두는 공간이에요. 파일이 종이 한 장이라면 폴더는 종이를 모아두는
              서류철에 가까워요. 이번 페이지의 파일을 한곳에 모아두면 제목을 바꾸거나 내용을 추가할
              때도 같은 작업을 이어가기 쉬워요.
            </p>
            <ol className={system.decisionSteps}>
              <li>
                <strong>{os === "windows" ? "파일 탐색기" : "Finder"} 열기</strong>
                <span>바탕 화면이나 문서처럼 다시 찾기 쉬운 위치를 골라요.</span>
              </li>
              <li>
                <strong>새 폴더 만들기</strong>
                <span>
                  폴더 이름을 <code>my-first-web</code>으로 정해요. 아직 파일이나 코드는 쓰지
                  않아요.
                </span>
              </li>
            </ol>
            <p className={system.aiKeyTakeaway}>
              뒤 수업에서도 <strong>같은 폴더</strong>를 써요. 이미 있다면 지우지 말고 안의 파일을
              먼저 확인해요.
            </p>
          </div>
        )}
        {step === 2 && part === 1 && (
          <div className={system.aiConceptSlide}>
            <p>
              <strong>프로젝트</strong>는 함께 작업할 파일과 대화를 묶는 단위예요.
            </p>
            <ol className={system.decisionSteps}>
              <li>
                <strong>프로젝트에 폴더 추가</strong>
                <span>
                  프로젝트 추가·폴더 열기에서 <code>my-first-web</code>을 선택해요.
                </span>
              </li>
              <li>
                <strong>이 컴퓨터에서 작업하기</strong>
                <span>
                  로컬(Local / This computer)을 선택해요. 로컬은 지금 쓰는 컴퓨터라는 뜻이에요.
                </span>
              </li>
              <li>
                <strong>연결된 폴더 이름 확인</strong>
                <span>
                  작업할 위치가 <code>my-first-web</code>인지 확인해요.
                </span>
              </li>
            </ol>
            <details className={system.preparationMore}>
              <summary>프로젝트는 있는데 폴더가 연결되지 않았어요</summary>
              <p>
                프로젝트 메뉴의 Edit project(프로젝트 편집) → Add folder(폴더 추가)에서 연결해요.
              </p>
            </details>
            <a href="https://learn.chatgpt.com/docs/projects" target="_blank" rel="noreferrer">
              프로젝트·폴더 공식 안내 ↗
            </a>
          </div>
        )}
        {step === 2 && part === 2 && (
          <div className={system.aiConceptSlide}>
            <dl className={system.recapPoints}>
              <div>
                <dt>요청 입력창</dt>
                <dd>AI에게 할 일을 적어 보내는 칸을 찾아요.</dd>
              </div>
              <div>
                <dt>작업 중지</dt>
                <dd>앱의 사용 안내에서 작업을 멈추는 방법을 미리 확인해요.</dd>
              </div>
              <div>
                <dt>권한 안내</dt>
                <dd>파일 변경·명령 실행을 허용할지 물으면 하려는 일과 작업 범위를 읽어요.</dd>
              </div>
            </dl>
            <p>
              “이 폴더의 파일을 수정해도 될까요?”라는 안내가 나오면 내가 실습하려던 폴더인지, 부탁한
              작업인지 읽어보세요. <strong>어디에 어떤 작업을 하려는지</strong> 모르면 허용하기 전에
              AI에게 설명을 요청할 수 있어요.
            </p>
            <p className={system.aiKeyTakeaway}>
              지금은 <strong>요청을 보내지 않아요.</strong> 실제 요청과 결과 확인은 다음 수업에서
              해요.
            </p>
          </div>
        )}
        {step === 3 && (
          <section className={system.exampleQuestion} aria-label="공통 작업 흐름 확인">
            <p data-current-action tabIndex={-1}>
              다른 코드 에이전트에서도 적용할 수 있는 것을 하나 골라주세요.
            </p>
            <div className={system.choices}>
              {[
                "버튼의 정확한 위치와 모든 이용 조건",
                flow,
                "웹 채팅 로그인만으로 내 프로젝트 파일이 바뀐다는 기대",
              ].map((value, index) => (
                <button
                  key={value}
                  className={system.choice}
                  aria-label={value}
                  aria-pressed={answer === index}
                  data-answer={
                    answer === index ? (index === 1 ? "correct" : "incorrect") : undefined
                  }
                  onClick={() => setAnswer(index)}
                >
                  {value}
                  {answer === index && (
                    <span className={system.answerMark}>{index === 1 ? "✓ 정답" : "× 오답"}</span>
                  )}
                </button>
              ))}
            </div>
            <p role="status" className={system.quizFeedback}>
              {answer === null
                ? ""
                : answer === 1
                  ? "맞아요. 화면이 달라도 작업 공간을 정하고 파일 변경과 실행 결과를 확인하는 흐름은 같아요."
                  : "화면·기능·권한은 도구마다 달라요. 실제 파일과 결과를 확인하는 흐름을 떠올려봐요."}
            </p>
          </section>
        )}
        {step === 4 && (
          <section className={system.exampleQuestion} aria-label="컴퓨터 준비 상태">
            {mode === "computer" ? (
              <>
                <p data-current-action tabIndex={-1}>
                  실제 컴퓨터에서 확인한 항목만 표시해주세요.
                </p>
                <div className={system.setupChecks}>
                  {preparationChecks.map((value, index) => (
                    <label key={value}>
                      <input
                        type="checkbox"
                        checked={checks[index]}
                        onChange={(event) => {
                          setChecks((previous) =>
                            previous.map((checked, i) =>
                              i === index ? event.target.checked : checked,
                            ),
                          );
                          setStatus(null);
                        }}
                      />
                      {value}
                    </label>
                  ))}
                </div>
                <div className={system.choices}>
                  <button
                    className={system.choice}
                    disabled={!checks.every(Boolean)}
                    aria-pressed={status === "ready"}
                    onClick={() => setStatus("ready")}
                  >
                    컴퓨터 준비 확인
                  </button>
                  <button
                    className={system.choice}
                    aria-pressed={status === "pending"}
                    onClick={() => setStatus("pending")}
                  >
                    아직 준비가 필요해요
                  </button>
                </div>
              </>
            ) : (
              <p>
                모바일에서는 설명과 문제로 복습했어요. 실제 앱과 폴더 준비는 실습할 컴퓨터에서
                진행해요.
              </p>
            )}
            <p role="status">{status ? statusLabels[status] : "준비 상태를 선택해주세요."}</p>
            <small>
              문제 정답과 실제 준비는 별개예요. 외부 앱 상태를 자동 검사하지 않으며, 이번 방문
              동안만 기록해요.
            </small>
          </section>
        )}
        {step === 5 && (
          <>
            <section aria-labelledby="setup-recap-title">
              <h3 id="setup-recap-title">배운 핵심</h3>
              <dl className={system.recapPoints}>
                <div>
                  <dt>앱과 계정</dt>
                  <dd>앱 설치 후 내 계정에서 Codex를 사용할 수 있는지 확인해요.</dd>
                </div>
                <div>
                  <dt>실습 폴더</dt>
                  <dd>
                    <code>my-first-web</code>을 연결하고 같은 폴더에서 작업해요.
                  </dd>
                </div>
                <div>
                  <dt>현재 준비 상태</dt>
                  <dd>{status ? statusLabels[status] : "컴퓨터 준비 필요"}</dd>
                </div>
              </dl>
            </section>
            <section className={system.nextLesson}>
              <small>다음 수업</small>
              <h3>{workbookLessonLabel("agent", 3)}</h3>
              <p>
                작은 요청을 보내고 결과를 확인하며 고쳐봐요. 컴퓨터 준비가 남았다면 예시로 복습할 수
                있어요.
              </p>
            </section>
          </>
        )}
      </div>
      <aside className={system.lessonPanel} aria-label="학습 안내">
        <div className={system.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>에이전트와 실습 폴더 준비하기</h2>
          <p>앱 설치 → 계정 확인 → 폴더 연결 순서로 준비해요.</p>
          <small>Windows·Mac에서 실습 · 모바일에서는 복습해요.</small>
        </div>
        <WorkbookActionReturn body={body} enabled={step === 4} />
        <nav className={system.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={screen}>
            {(step > 0 || part > 0) && (
              <button
                onClick={() => {
                  if (step < 3 && part > 0)
                    setParts((previous) => ({ ...previous, [step]: part - 1 }));
                  else move(step - 1);
                }}
              >
                이전 설명
              </button>
            )}
          </WorkbookLessonPrevious>
          {step < 5 ? (
            <button
              disabled={blocked}
              onClick={() => {
                if (step < 3 && part < 2)
                  setParts((previous) => ({ ...previous, [step]: part + 1 }));
                else move(step + 1);
              }}
            >
              {step === 4 ? "학습 정리 보기" : "다음으로"}
            </button>
          ) : (
            <button
              disabled={!canFinish}
              onClick={() => {
                if (status !== null && canFinish) onComplete(status);
              }}
            >
              학습 마치고 단원 지도로 →
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}
