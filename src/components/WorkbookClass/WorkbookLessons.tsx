"use client";

import { workbookLessonLabel } from "@/lib/workbook-course";
import { workbookLearningExample } from "@/lib/workbook-learning-example";
import { WorkbookChatGrowth } from "./WorkbookChatGrowth";
import { WorkbookCodeIsText } from "./WorkbookCodeIsText";
import { WorkbookLessonRecap } from "./WorkbookLessonRecap";
import { WorkbookLlmCollage } from "./WorkbookLlmCollage";
import { WorkbookLlmNested } from "./WorkbookLlmNested";
import { WorkbookAiEraCollage } from "./WorkbookAiEraCollage";
import { WorkbookLessonHeader } from "./WorkbookLessonHeader";
import { WorkbookLessonPrevious } from "./WorkbookLessonPrevious";

// 설명 페이지, 예시 비교와 확인 문제의 선택을 화면 안에서 유지한다.
import { WorkbookActionReturn } from "./WorkbookActionReturn";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";
import system from "./WorkbookLesson.module.scss";

const examples = [
  {
    name: "소개 글",
    format: "문장",
    result: workbookLearningExample.firstResult,
    feature: "초안 쓰기 · 문장 고치기",
    check: "알려준 사실과 원하는 표현에 맞는지 읽어봐요.",
  },
  {
    name: "표지 그림",
    format: "이미지 파일",
    result: "창가와 펼친 책을 담은 표지 그림",
    feature: "이미지 생성 · 파일로 저장",
    check: "그림을 말로 설명하는 기능과 실제 이미지 생성은 달라요.",
  },
  {
    name: "웹 화면",
    format: "브라우저에서 확인할 화면",
    result: workbookLearningExample.title,
    feature: "코드 작성 · 파일 반영 · 실행 확인",
    check: "코드 답변만 받았는지, 실제 파일과 화면까지 확인했는지 구분해요.",
  },
];

function AnswerMark({ correct }: { correct: boolean }) {
  return (
    <span className={system.answerMark}>
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {correct ? <path d="m5 12 4 4L19 6" /> : <path d="m6 6 12 12M18 6 6 18" />}
      </svg>
      {correct ? "정답" : "오답"}
    </span>
  );
}

export function WorkbookLessons({
  initialLesson,
  onBack,
  onComplete,
}: {
  initialLesson: number;
  onBack: () => void;
  onComplete: (lesson: number) => void;
}) {
  const p = useWorkbookProgress();
  const learningUnit = initialLesson === 0 ? "ai-1" : "ai-2";
  function reviewLearning() {
    p.dispatchProjectWorkflow({ type: "learn", unit: learningUnit, status: "in-progress" });
  }
  const lesson = initialLesson;
  const ui = system;
  const [step, setStep] = useWorkbookLessonState(`ai-${lesson}-step`, 0);
  const [revealed, setRevealed] = useWorkbookLessonState<Record<number, number>>(
    `ai-${lesson}-revealed`,
    {},
  );
  const part = revealed[step] ?? 0;
  const gradual = step === 0 || (lesson === 1 && (step === 1 || step === 2));
  // 1-1은 다섯 장을 펼치는 첫 단계와 정리 화면 두 단계다.
  const lastStep = lesson === 1 ? 4 : 1;
  // 1-1 첫 단계는 재기획한 화면들을 차례로 펼친다(현재 다섯 장). 다른 단계는 세 장씩.
  const lastPart = lesson === 0 && step === 0 ? 4 : 2;
  // 숫자는 수업 전체의 화면 위치다. 화면 안의 예시 전환·답 선택은 세지 않는다.
  const totalScreens = lesson === 0 ? 6 : 11;
  const currentScreen = gradual ? step * 3 + part + 1 : lesson === 0 ? step + 5 : step + 7;
  const [conceptAnswer, setConceptAnswer] = useWorkbookLessonState<number | null>(
    `ai-${lesson}-conceptAnswer`,
    null,
  );
  const [answer, setAnswer] = useWorkbookLessonState<number | null>(`ai-${lesson}-answer`, null);
  const [example, setExample] = useWorkbookLessonState(`ai-${lesson}-example`, 0);
  const [layer, setLayer] = useWorkbookLessonState(`ai-${lesson}-layer`, "tool");
  const [overlap, setOverlap] = useWorkbookLessonState<boolean | null>(
    `ai-${lesson}-overlap`,
    null,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    // 설명이 펼쳐져 진행 버튼 수가 바뀌어도 현재 키보드 조작을 화면 안에 둔다.
    const focused = document.activeElement;
    if (
      focused instanceof HTMLButtonElement &&
      body.current?.parentElement?.contains(focused) &&
      focused.closest("nav")?.getAttribute("aria-label") === "수업 진행"
    )
      focused.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [step, part]);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const correct = lesson === 0 ? answer === 2 : answer === 1 && overlap === true;
  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  return (
    <section className={system.lesson}>
      <WorkbookLessonHeader
        stage="agent"
        point={lesson}
        headingRef={heading}
        onBack={onBack}
        current={currentScreen}
        total={totalScreens}
      />
      <div ref={body} className={ui.lessonBody} tabIndex={0} aria-label="수업 내용">
        {lesson === 0 && step === lastStep && <WorkbookLessonRecap />}
        {lesson !== 0 && step === lastStep && (
          <>
            <h2 className={system.screenTitle}>
              {lesson === 0 ? (
                <>
                  AI의 초안은 출발점,
                  <br />
                  확인은 내가 해요
                </>
              ) : (
                <>
                  만들 결과에 맞춰,
                  <br />
                  도구의 기능을 확인해요
                </>
              )}
            </h2>
            <section aria-labelledby="recap-key-title">
              <h3 id="recap-key-title">배운 핵심</h3>
              <dl className={system.recapPoints}>
                {(lesson === 0
                  ? [
                      ["생성형 AI", "요청을 바탕으로 글·이미지·코드 같은 결과를 만들어요."],
                      ["LLM", "언어를 다루는 모델로, 글 요약과 코드 작성에도 쓰여요."],
                      ["결과 확인", "알려준 사실과 부탁한 조건에 맞는지 직접 확인해요."],
                    ]
                  : [
                      ["결과와 기능", "소개 글·그림·웹 화면에 필요한 기능을 먼저 살펴봐요."],
                      [
                        "모델과 도구",
                        "모델은 결과를 만드는 핵심, 도구는 그 기능을 사용하는 작업 환경이에요.",
                      ],
                      [
                        "실제 파일 작업",
                        "웹·앱의 구분이나 설치 여부만으로 판단하지 않고 기능·폴더·권한을 확인해요.",
                      ],
                    ]
                ).map(([term, text]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{text}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className={system.nextLesson} aria-labelledby="next-lesson-title">
              <small>다음 수업</small>
              <h3 id="next-lesson-title">{workbookLessonLabel("agent", lesson === 0 ? 1 : 2)}</h3>
              <p>
                {lesson === 0
                  ? "학습을 마친 뒤 단원 지도에서 다음 수업을 시작해요. 만들 결과에 필요한 도구 기능을 살펴볼 거예요."
                  : "학습을 마친 뒤 단원 지도에서 다음 수업을 시작해요. 개인 컴퓨터에서 코드 에이전트의 설치·로그인·실습 폴더 연결을 준비해요."}
              </p>
            </section>
            <p className={system.recapScope}>학습 예시 복습 · 다음 수업으로 이어가요.</p>
          </>
        )}

        {/* 1단원 재기획(1-1 화면 1) 콜라주 시안: 제목·설명이 장면 안에 붙는다. 이전 메모→소개문 화면(WorkbookAiOpening)을 대신한다. */}
        {lesson === 0 && step === 0 && part === 0 && <WorkbookAiEraCollage />}
        {lesson === 0 && step === 0 && part === 4 && <WorkbookLlmCollage />}
        {lesson === 0 && step === 0 && part !== 0 && part !== 4 && (
          <>
            <h2 id="lesson-screen-title" className={system.screenTitle}>
              {part === 1
                ? "코드도 결국 글자예요"
                : part === 2
                  ? "다만, 한 번에 완성되지 않아요"
                  : "그럼 LLM은 뭘까요"}
            </h2>
            {part === 1 && <WorkbookCodeIsText />}
            {part === 2 && <WorkbookChatGrowth />}
            {part === 3 && <WorkbookLlmNested />}
          </>
        )}
        {lesson === 1 && step === 0 && (
          <>
            <h2 className={system.screenTitle}>
              {part === 0 ? (
                <>
                  도구 이름보다,
                  <br />
                  만들 결과부터 정해요
                </>
              ) : part === 1 ? (
                <>
                  같은 기준으로,
                  <br />
                  결과와 기능을 비교해요
                </>
              ) : (
                <>
                  한 도구가 여러 결과를
                  <br />
                  만들 수도 있어요
                </>
              )}
            </h2>
            {part === 0 && (
              <div className={system.aiConceptSlide}>
                <p>
                  AI 도구마다 제공하는 기능이 달라요. <strong>무엇을 만들지</strong> 먼저 정하면
                  필요한 기능을 찾기 쉬워져요.
                </p>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="만들 결과와 필요한 기능"
                >
                  <thead>
                    <tr>
                      <th scope="col">만들 결과</th>
                      <th scope="col">살펴볼 기능</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examples.map((item) => (
                      <tr key={item.name}>
                        <th scope="row">{item.name}</th>
                        <td>{item.feature}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {part === 1 && (
              <section className={system.resultComparison} aria-label="결과 예시 비교">
                <p className={system.comparisonContext}>
                  하나의 소개 페이지에 들어갈 글과 그림, 둘을 배치한 화면이에요.
                </p>
                <div className={system.resultTabs} role="group" aria-label="결과 예시 선택">
                  {examples.map((item, index) => (
                    <button
                      key={item.name}
                      aria-pressed={example === index}
                      onClick={() => setExample(index)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <div className={system.resultDemo} aria-live="polite">
                  <div className={system.resultPreview}>
                    <small>{examples[example].format}</small>
                    {example === 1 ? (
                      <Image
                        src="/images/workbook/reading-places-cover.svg"
                        alt="창가와 펼친 책을 담은 장소 소개 페이지용 표지 그림"
                        width={640}
                        height={320}
                        sizes="(min-width: 1024px) 360px, 90vw"
                      />
                    ) : (
                      <>
                        {example === 2 ? (
                          <div className={system.webExample}>
                            <small>장소 모음 · 소개 페이지</small>
                            <Image
                              src="/images/workbook/reading-places-cover.svg"
                              alt="소개 글과 함께 배치한 창가와 책 표지"
                              width={640}
                              height={320}
                              sizes="360px"
                            />
                            <strong>{examples[example].result}</strong>
                            <p>{examples[0].result}</p>
                          </div>
                        ) : (
                          <p>{examples[example].result}</p>
                        )}
                      </>
                    )}
                  </div>
                  <dl className={system.resultFacts}>
                    <div>
                      <dt>필요한 기능</dt>
                      <dd>{examples[example].feature}</dd>
                    </div>
                    <div>
                      <dt>확인할 점</dt>
                      <dd>{examples[example].check}</dd>
                    </div>
                  </dl>
                </div>
                <small className={system.resultNotice}>사전 제작한 글·그림·화면 예시예요.</small>
              </section>
            )}
            {part === 2 && (
              <div className={system.aiConceptSlide}>
                <p>
                  소개 글과 표지 그림을 한 도구에서 만들 수도 있어요. 결과 세 가지가 도구 세 개를
                  뜻하지는 않아요.
                </p>
                <ol className={system.decisionSteps}>
                  <li>
                    <strong>만들 결과 정하기</strong>
                    <span>소개 글인지, 이미지 파일인지, 웹 화면인지</span>
                  </li>
                  <li>
                    <strong>필요한 기능 찾기</strong>
                    <span>글 수정 · 이미지 생성과 저장 · 파일 작업과 실행</span>
                  </li>
                  <li>
                    <strong>도구에서 확인하기</strong>
                    <span>그 기능을 제공하는지, 내 이용 조건에서 쓸 수 있는지</span>
                  </li>
                </ol>
              </div>
            )}
          </>
        )}
        {lesson === 1 && step === 1 && (
          <>
            <h2 className={system.screenTitle}>
              {part === 0 ? (
                <>
                  모델은 결과를 만들고,
                  <br />
                  도구는 작업을 연결해요
                </>
              ) : part === 1 ? (
                <>
                  도구 안에서,
                  <br />
                  모델의 기능을 사용해요
                </>
              ) : (
                <>
                  같은 모델이어도,
                  <br />
                  도구의 기능은 달라요
                </>
              )}
            </h2>
            {part === 0 && (
              <div className={system.aiConceptSlide}>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="모델과 도구의 역할"
                >
                  <thead>
                    <tr>
                      <th scope="col">구분</th>
                      <th scope="col">하는 일</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">모델</th>
                      <td>
                        <strong>결과 만들기</strong>
                        <span className={system.cellDescription}>
                          입력을 처리하도록 학습된 AI의 핵심
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">도구</th>
                      <td>
                        <strong>요청하고 결과 다루기</strong>
                        <span className={system.cellDescription}>
                          모델을 이용하는 웹사이트나 프로그램
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p>
                  장소 메모를 소개 문장으로 바꾸는 데 모델을 사용해요. 우리가 메모를 입력하고 답변을
                  복사하거나 저장하는 웹사이트·앱은 도구예요.{" "}
                  <strong>결과를 만드는 핵심과 그것을 사용하는 환경</strong>을 나눠 생각하면 됩니다.
                </p>
              </div>
            )}
            {part === 1 && (
              <section className={system.resultComparison} aria-label="모델과 도구 관계 살펴보기">
                <div className={system.resultTabs} role="group" aria-label="살펴볼 구성">
                  <button aria-pressed={layer === "tool"} onClick={() => setLayer("tool")}>
                    도구 살펴보기
                  </button>
                  <button aria-pressed={layer === "model"} onClick={() => setLayer("model")}>
                    모델 살펴보기
                  </button>
                </div>
                <div className={system.layerDiagram}>
                  <div data-active={layer === "tool"}>
                    <strong>도구</strong>
                    <p>요청 입력 · 파일 첨부 · 결과 저장</p>
                    <div data-active={layer === "model"}>
                      <strong>AI 모델</strong>
                      <p>입력을 처리하고 결과 만들기</p>
                    </div>
                  </div>
                </div>
                <p aria-live="polite">
                  {layer === "tool"
                    ? "내가 요청하고 결과를 다루는 작업 환경이에요."
                    : "도구에서 전달받은 입력을 처리하는 AI의 핵심 부분이에요."}
                </p>
                <small className={system.resultNotice}>
                  관계를 단순화한 그림이에요. 실제 구성과 제공 기능은 도구마다 달라요.
                </small>
              </section>
            )}
            {part === 2 && (
              <div className={system.aiConceptSlide}>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="모델과 도구의 조합"
                >
                  <thead>
                    <tr>
                      <th scope="col">경우</th>
                      <th scope="col">가능한 구성</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">하나의 도구</th>
                      <td>여러 모델 중에서 선택할 수도 있어요.</td>
                    </tr>
                    <tr>
                      <th scope="row">같은 모델</th>
                      <td>여러 도구에서 사용할 수도 있어요.</td>
                    </tr>
                  </tbody>
                </table>
                <p className={system.aiKeyTakeaway}>
                  모델 이름만 보고 판단하지 말고 <strong>필요한 기능의 제공 여부</strong>를
                  확인해요.
                </p>
              </div>
            )}
          </>
        )}
        {lesson === 1 && step === 2 && (
          <>
            <h2 className={system.screenTitle}>
              {part === 0 ? (
                <>
                  웹·앱은,
                  <br />
                  접속하는 방식이에요
                </>
              ) : part === 1 ? (
                <>
                  에이전트는 도구를 쓰며,
                  <br />
                  작업을 이어가요
                </>
              ) : (
                <>
                  앱 설치만으로,
                  <br />
                  파일을 고칠 준비가 됐을까요?
                </>
              )}
            </h2>
            {part === 0 && (
              <div className={system.aiConceptSlide}>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="웹과 데스크톱 앱의 접속 방식"
                >
                  <thead>
                    <tr>
                      <th scope="col">방식</th>
                      <th scope="col">여는 방법</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">웹</th>
                      <td>Chrome·Safari 같은 브라우저에서 주소로 접속해요.</td>
                    </tr>
                    <tr>
                      <th scope="row">데스크톱 앱</th>
                      <td>Windows나 Mac에 설치하고 실행해요.</td>
                    </tr>
                  </tbody>
                </table>
                <p>
                  웹과 앱은 어디서 여는지의 차이예요. 파일을 다룰 수 있는지는 별도로 확인해요.
                  설치한 앱도 인터넷이 필요할 수 있어요.
                </p>
                <p className={system.aiKeyTakeaway}>
                  <strong>접속 방식과 작업 기능은 다른 기준이에요.</strong>
                </p>
              </div>
            )}
            {part === 1 && (
              <div className={system.aiConceptSlide}>
                <p>
                  <strong>LLM은 언어를 다루는 모델</strong>이에요. 에이전트는 모델을 활용해 다음
                  행동을 정하고, 연결된 도구로 작업한 결과를 보며 목표를 향해 이어가는 시스템이에요.
                  예를 들어 파일을 읽고 → 제목을 바꾸고 → 실행 결과를 살펴보는 작업을 이어갈 수
                  있어요. 가능한 작업은 연결된 도구와 권한에 따라 달라요.
                </p>
                <table
                  className={`${system.aiResultTable} ${system.aiCheckTable}`}
                  aria-label="코드 답변과 실제 파일 작업"
                >
                  <thead>
                    <tr>
                      <th scope="col">작업 흐름</th>
                      <th scope="col">페이지를 만들어달라고 요청하면</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">코드 답변 받기</th>
                      <td>받은 코드를 파일에 반영하고 실행하는 일은 따로 필요해요.</td>
                    </tr>
                    <tr>
                      <th scope="row">코드 에이전트로 작업</th>
                      <td>
                        허용된 폴더에서 파일을 만들거나 고치고 명령을 실행할 수 있어요. 연결된
                        기능과 권한에 따라 달라요.
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className={system.aiKeyTakeaway}>
                  에이전트도 실수할 수 있어요.{" "}
                  <strong>파일 변경과 실행 결과는 직접 확인해요.</strong>
                </p>
              </div>
            )}
            {part === 2 && (
              <section className={system.exampleQuestion} aria-label="파일 작업 준비 확인 문제">
                <p data-current-action tabIndex={-1} id="workbook-lesson-next-action">
                  설치 여부와 실제 할 수 있는 일을 구분해서 골라보세요.
                </p>
                <div className={ui.choices}>
                  {[
                    "설치했으니 파일을 자동으로 고칠 수 있어요",
                    "파일 작업 기능과 연결된 폴더·권한을 확인해야 해요",
                  ].map((value, index) => (
                    <button
                      key={value}
                      className={ui.choice}
                      aria-label={value}
                      aria-pressed={conceptAnswer === index}
                      data-answer={
                        conceptAnswer === index
                          ? index === 1
                            ? "correct"
                            : "incorrect"
                          : undefined
                      }
                      onClick={() => {
                        if (conceptAnswer !== index) reviewLearning();
                        setConceptAnswer(index);
                      }}
                    >
                      {value}
                      {conceptAnswer === index && <AnswerMark correct={index === 1} />}
                    </button>
                  ))}
                </div>
                <p role="status" className={ui.quizFeedback}>
                  {conceptAnswer === null
                    ? ""
                    : conceptAnswer === 1
                      ? "맞아요. 설치만으로 파일 작업이 가능해지는 것은 아니에요. 기능·연결된 폴더·권한을 함께 확인해요."
                      : "데스크톱 앱에도 일반 채팅이 있어요. 실제 파일을 다루는 기능과 작업 범위를 확인해야 해요."}
                </p>
              </section>
            )}
          </>
        )}
        {lesson === 1 && step === 3 && (
          <>
            <h2 className={system.screenTitle}>
              도구 이름보다,
              <br />
              필요한 기능을 골라봐요
            </h2>
            <section className={system.exampleQuestion} aria-labelledby="image-function-question">
              <h3 id="image-function-question">표지 그림을 이미지 파일로 받고 싶어요.</h3>
              <p
                className={system.questionInstruction}
                data-current-action
                tabIndex={-1}
                id="workbook-lesson-next-action"
              >
                가장 먼저 확인할 기능을 골라보세요.
              </p>
              <div className={`${ui.choices} ${system.quizChoices}`}>
                {[
                  "그림을 말로 설명하는 기능",
                  "이미지를 생성하고 저장하는 기능",
                  "가장 최신 모델 이름",
                ].map((value, index) => (
                  <button
                    key={value}
                    className={ui.choice}
                    aria-pressed={answer === index}
                    aria-label={value}
                    data-answer={
                      answer === index ? (index === 1 ? "correct" : "incorrect") : undefined
                    }
                    onClick={() => {
                      if (answer !== index) reviewLearning();
                      setAnswer(index);
                    }}
                  >
                    <span>{value}</span>
                    <span className={system.choiceResult}>
                      {answer === index && <AnswerMark correct={index === 1} />}
                    </span>
                  </button>
                ))}
              </div>
              <p role="status" className={ui.quizFeedback}>
                {answer === null
                  ? ""
                  : answer === 1
                    ? "맞아요. 실제 이미지 파일이 필요하니 생성과 저장 기능을 확인해요."
                    : "이름이나 글 설명만으로는 이미지 파일을 받을 수 있는지 알 수 없어요. 원하는 결과를 만드는 기능을 찾아보세요."}
              </p>
            </section>
            <section
              className={system.exampleQuestion}
              aria-labelledby="multiple-functions-question"
            >
              <h3 id="multiple-functions-question">
                한 도구가 글과 이미지를 모두 만들 수도 있을까요?
              </h3>
              <div className={`${ui.choices} ${system.binaryChoices}`}>
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    className={ui.choice}
                    aria-pressed={overlap === value}
                    aria-label={value ? "그럴 수 있어요" : "반드시 따로 써야 해요"}
                    data-answer={overlap === value ? (value ? "correct" : "incorrect") : undefined}
                    onClick={() => {
                      if (overlap !== value) reviewLearning();
                      setOverlap(value);
                    }}
                  >
                    {value ? "그럴 수 있어요" : "반드시 따로 써야 해요"}
                    {overlap === value && <AnswerMark correct={value} />}
                  </button>
                ))}
              </div>
              <p role="status" className={ui.quizFeedback}>
                {overlap === null
                  ? ""
                  : overlap
                    ? "맞아요. 한 도구가 여러 기능을 제공하기도 해요."
                    : "작업마다 새 도구를 설치해야 하는 것은 아니에요. 제공하는 기능을 먼저 살펴봐요."}
              </p>
            </section>
          </>
        )}
      </div>
      <aside className={ui.lessonPanel} aria-label="학습 안내">
        <div className={ui.panelNotes}>
          <span className={styles.companion} data-companion aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>
            {lesson === 0 ? "AI의 도움과 확인할 일 구분하기" : "접속 방식과 AI 작업 방식 구분하기"}
          </h2>
          <p>
            {lesson === 0
              ? "초안은 함께 만들고, 내 작업에 맞는지는 직접 확인해요."
              : "웹·앱은 접속 방식, 모델·에이전트는 일을 하는 방식과 구성으로 구분해요."}
          </p>
          <small>개인 컴퓨터에서 실습 · 모바일에서는 복습해요.</small>
        </div>
        <WorkbookActionReturn body={body} enabled={!gradual} />
        <nav className={ui.lessonNavigation} aria-label="수업 진행">
          <WorkbookLessonPrevious current={currentScreen}>
            {(step > 0 || part > 0) && (
              <button
                data-action-role={lesson === 0 ? "lesson-back" : undefined}
                className={styles.quiet}
                onClick={() => {
                  if (gradual && part > 0) {
                    setRevealed((previous) => ({ ...previous, [step]: part - 1 }));
                    if (part === 1) requestAnimationFrame(() => heading.current?.focus());
                  } else move(step - 1);
                }}
              >
                이전 설명
              </button>
            )}
          </WorkbookLessonPrevious>
          {step < lastStep ? (
            <button
              data-action-role={lesson === 0 ? "lesson-next" : undefined}
              disabled={
                (lesson === 1 && step === 3 && !correct) ||
                (lesson === 1 && step === 2 && part === 2 && conceptAnswer !== 1)
              }
              onClick={() => {
                if (gradual && part < lastPart)
                  setRevealed((previous) => ({ ...previous, [step]: part + 1 }));
                else move(step + 1);
              }}
            >
              {lesson === 1 && step === 3 ? "학습 정리 보기" : "다음으로"}
            </button>
          ) : (
            <button
              data-action-role={lesson === 0 ? "lesson-next" : undefined}
              disabled={lesson === 1 && !correct}
              onClick={() => {
                p.dispatchProjectWorkflow({
                  type: "learn",
                  unit: learningUnit,
                  status: "confirmed",
                  source: "example",
                });
                onComplete(lesson);
                onBack();
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
