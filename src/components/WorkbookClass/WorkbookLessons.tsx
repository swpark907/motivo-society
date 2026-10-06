"use client";

// 설명 페이지, 예시 비교와 확인 문제의 선택을 화면 안에서 유지한다.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./WorkbookClass.module.scss";

const names = ["AI 이해하기", "AI 종류와 도구 알아보기"];
const examples = [
  {
    name: "소개 글",
    result: "차를 따르고, 숨을 고르고, 돌을 쌓으며 잠깐 쉬어가는 웹 경험을 만듭니다.",
    description: "대화로 생각을 정리하고 글의 초안을 만들거나 표현을 고칠 수 있어요.",
  },
  {
    name: "표지 그림",
    result: "작업실 분위기를 담은 이미지 파일",
    description:
      "그림을 말로 설명받는 것과 실제 이미지 파일을 만드는 것은 달라요. 이미지 생성과 저장 기능을 확인해요.",
  },
  {
    name: "웹 화면",
    result: "작은 쉼을 만드는 작업실",
    description:
      "코드를 만드는 것에 더해 파일에 반영하고, 화면에서 결과를 확인할 수 있는지도 살펴봐요.",
  },
];

function AnswerMark({ correct }: { correct: boolean }) {
  return (
    <span className={styles.answerMark}>
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
  const lesson = initialLesson;
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState<Record<number, number>>({});
  const part = revealed[step] ?? 0;
  const gradual = step === 0 || (lesson === 1 && step === 1);
  const [shown, setShown] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [example, setExample] = useState(0);
  const [layer, setLayer] = useState("tool");
  const [overlap, setOverlap] = useState<boolean | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
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
    <section className={`${styles.section} ${styles.lesson}`}>
      <header className={styles.lessonHeader}>
        <div className={styles.top}>
          <span className="label">
            LESSON 0{lesson + 1} · {step + 1} / 3
          </span>
          <button className={styles.quiet} onClick={onBack}>
            마을 지도로
          </button>
        </div>
        <h1 ref={heading} tabIndex={-1}>
          {names[lesson]}
        </h1>
        <span className={styles.location}>
          카피바라와 함께 · {lesson === 0 ? "첫 만남의 찻집" : "도구 장터"}
        </span>
      </header>
      <div ref={body} className={styles.lessonBody} tabIndex={0} aria-label="수업 내용">
        {lesson === 0 && step === 0 && (
          <>
            <h2>AI에게 어떤 도움을 받을 수 있을까요?</h2>
            {part === 0 && (
              <p>
                AI는 인공지능을 뜻해요. 언어를 다루거나 이미지의 특징을 찾고, 다음 결과를 예측하는
                등 여러 작업을 수행하는 기술과 시스템을 넓게 부르는 말이에요.
              </p>
            )}
            {part === 1 && (
              <div className={styles.revealBlock}>
                <div className={styles.preview}>
                  <strong>이 클래스에서는 생성형 AI를 사용해요.</strong>
                  <p>
                    요청과 주어진 정보를 바탕으로 글·이미지·코드 같은 결과를 만드는 AI예요. 소개문
                    초안을 쓰거나 웹 화면을 만드는 데 도움을 받을 수 있어요.
                  </p>
                </div>
              </div>
            )}
            {part === 2 && (
              <div className={styles.revealBlock}>
                <p>
                  내 의도를 전부 알거나 항상 맞는 답을 주지는 않아요. 알려주지 않은 사실을
                  그럴듯하게 덧붙일 수도 있어요. 그래서 나온 결과를 직접 확인해야 해요.
                </p>
                <details>
                  <summary>코드는 무엇인가요?</summary>
                  <p>
                    컴퓨터가 할 일을 표현한 글이에요. 웹에서는 무엇을 놓고 어떻게 보여줄지, 버튼을
                    누르면 무엇을 할지 등을 정해요. 지금은 외울 필요 없어요.
                  </p>
                </details>
              </div>
            )}
          </>
        )}
        {lesson === 0 && step === 1 && (
          <>
            <h2>그럴듯한 문장도 확인해봐요</h2>
            <p>카피바라: “내가 만든 작은 웹들을 소개하고 싶은데, 첫 문장이 잘 안 써져.”</p>
            <blockquote>
              차 따르기, 숨 고르기, 돌 쌓기를 해보는 작은 웹 경험을 만들었어. 소개문 두 문장을 써줘.
            </blockquote>
            <button className={styles.quiet} onClick={() => setShown(true)} disabled={shown}>
              예시 결과 보기
            </button>
            {shown && (
              <>
                <div className={styles.preview}>
                  <small>미리 만든 학습 예시 · 실제 AI 응답이나 이용자 수가 아니에요.</small>
                  <p>
                    차를 따르고, 숨을 고르고, 돌을 쌓으며 잠깐 쉬어갈 수 있는 작은 웹 경험을
                    만듭니다. 이미 1만 명이 선택한 공간에서 오늘의 여유를 만나보세요.
                  </p>
                </div>
                <h2>알려준 내용으로 확인할 수 없는 부분은?</h2>
                <div className={styles.choices}>
                  {[
                    "차·호흡·돌 쌓는 웹 경험",
                    "잠깐 쉬어가는 소개 방향",
                    "이미 1만 명이 선택했다는 내용",
                  ].map((v, i) => (
                    <button
                      className={styles.choice}
                      key={v}
                      aria-pressed={answer === i}
                      aria-label={v}
                      data-answer={answer === i ? (i === 2 ? "correct" : "incorrect") : undefined}
                      onClick={() => setAnswer(i)}
                    >
                      {v}
                      {answer === i && <AnswerMark correct={i === 2} />}
                    </button>
                  ))}
                </div>
                <p role="status" className={styles.quizFeedback}>
                  {answer === null
                    ? "하나를 골라 이유를 확인해보세요."
                    : answer === 2
                      ? "맞아요. 이용자 수는 알려주지 않았어요. 근거가 없다면 사실로 소개하면 안 돼요."
                      : answer === 0
                        ? "세 가지 작업은 요청에서 알려줬어요. 새로 덧붙인 실적을 찾아볼까요?"
                        : "소개 방향은 내 의도와 맞는지 판단할 부분이에요. 근거 없이 추가한 숫자를 찾아보세요."}
                </p>
              </>
            )}
          </>
        )}
        {lesson === 0 && step === 2 && (
          <>
            <h2>초안을 부탁하고, 사실은 확인해요</h2>
            <ul>
              <li>생성형 AI는 글·이미지·코드 같은 결과를 만들 수 있어요.</li>
              <li>문장이 마음에 드는지와 내용이 사실인지는 따로 확인해요.</li>
              <li>직접 요청하고 수정하는 실습은 도구를 알고 준비한 다음에 해요.</li>
            </ul>
            <p>다음에는 하고 싶은 일에 맞는 기능을 살펴보고, 모델과 도구를 구분해볼 거예요.</p>
          </>
        )}
        {lesson === 1 && step === 0 && (
          <>
            <h2>이름보다 만들고 싶은 결과부터</h2>
            {part === 0 && <p>카피바라: “소개 글도 쓰고 그림도 넣고 싶은데, 어디서 시작할까?”</p>}
            {part === 1 && (
              <div className={styles.revealBlock}>
                <div className={styles.lessonActions} aria-label="결과 예시 선택">
                  {examples.map((v, i) => (
                    <button
                      className={styles.quiet}
                      key={v.name}
                      aria-pressed={example === i}
                      onClick={() => setExample(i)}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
                <div className={styles.preview} aria-live="polite">
                  <small>사전 제작한 결과 예시</small>
                  {example === 1 && (
                    <Image
                      className={styles.exampleImage}
                      src="/images/workbook/vibe-web-cover-v1.png"
                      alt="컴퓨터를 바라보는 카피바라의 따뜻한 작업실 그림"
                      width={1536}
                      height={1024}
                    />
                  )}
                  <h3>{examples[example].result}</h3>
                  {example === 2 && <p>소개 · 작업 모음 · 연락할 곳</p>}
                  <p>{examples[example].description}</p>
                </div>
              </div>
            )}
            {part === 2 && (
              <div className={styles.revealBlock}>
                <p>
                  한 도구가 글과 이미지를 함께 다루기도 해요. 세 가지 작업에 반드시 세 개의 도구가
                  필요한 것은 아니에요. 음성·영상 등 다른 용도도 있지만, 여기서는 웹 제작과 연결되는
                  것부터 살펴봐요.
                </p>
              </div>
            )}
          </>
        )}
        {lesson === 1 && step === 1 && (
          <>
            <h2>모델과 도구는 어떻게 다른가요?</h2>
            {part === 0 && (
              <p>
                <strong>모델</strong>은 입력을 처리하고 결과를 만들도록 학습된 AI의 핵심 부분이에요.{" "}
                <strong>도구</strong>는 그 기능을 이용하는 웹사이트나 프로그램이에요.
              </p>
            )}
            {part === 1 && (
              <div className={styles.revealBlock}>
                <div className={styles.lessonActions}>
                  <button
                    className={styles.quiet}
                    aria-pressed={layer === "tool"}
                    onClick={() => setLayer("tool")}
                  >
                    도구 살펴보기
                  </button>
                  <button
                    className={styles.quiet}
                    aria-pressed={layer === "model"}
                    onClick={() => setLayer("model")}
                  >
                    모델 살펴보기
                  </button>
                </div>
                <div className={styles.modelDiagram}>
                  <div data-active={layer === "tool"}>
                    <strong>도구</strong>
                    <p>요청 입력창 · 파일 올리기 · 결과 저장</p>
                    <div data-active={layer === "model"}>
                      <strong>AI 모델</strong>
                      <p>입력을 처리하고 결과 만들기</p>
                    </div>
                  </div>
                </div>
                <small>관계를 단순화한 그림이에요. 제공 기능은 도구마다 달라요.</small>
              </div>
            )}
            {part === 2 && (
              <div className={styles.revealBlock}>
                <p>
                  한 도구에서 여러 모델을 고를 수도 있고, 같은 모델을 여러 도구에서 쓸 수도 있어요.
                  모델 이름이 같다고 제공하는 기능까지 같지는 않아요.
                </p>
                <details>
                  <summary>실제 제품 예시 · 선택 읽기</summary>
                  <p>
                    Adobe Firefly는 텍스트 설명으로 이미지를 생성하고 모델을 선택하는 예를 보여줘요.
                    GitHub Copilot은 코드 편집기에서 대화·편집 기능을 제공해요. 이 수업의 실습
                    도구를 정한 것은 아니에요.
                  </p>
                  <a
                    href="https://helpx.adobe.com/sg/firefly/web/work-with-images/generate-images/generate-images-from-text-descriptions.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Firefly 공식 안내 ↗
                  </a>
                  <br />
                  <a
                    href="https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-in-ides"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Copilot 공식 안내 ↗
                  </a>
                </details>
              </div>
            )}
          </>
        )}
        {lesson === 1 && step === 2 && (
          <>
            <h2>필요한 기능을 골라봐요</h2>
            <p>작업실 그림을 이미지 파일로 받고 싶어요. 무엇을 먼저 확인할까요?</p>
            <div className={styles.choices}>
              {[
                "그림을 말로 설명하는 기능",
                "이미지를 생성하고 저장하는 기능",
                "가장 최신 모델 이름",
              ].map((v, i) => (
                <button
                  key={v}
                  className={styles.choice}
                  aria-pressed={answer === i}
                  aria-label={v}
                  data-answer={answer === i ? (i === 1 ? "correct" : "incorrect") : undefined}
                  onClick={() => setAnswer(i)}
                >
                  {v}
                  {answer === i && <AnswerMark correct={i === 1} />}
                </button>
              ))}
            </div>
            <p role="status" className={styles.quizFeedback}>
              {answer === null
                ? "필요한 결과를 생각하며 골라보세요."
                : answer === 1
                  ? "맞아요. 실제 이미지 파일이 필요하니 생성과 저장 기능을 확인해요."
                  : "이름이나 글 설명만으로는 이미지 파일을 받을 수 있는지 알 수 없어요. 원하는 결과를 만드는 기능을 찾아보세요."}
            </p>
            <h3>한 도구가 글과 이미지를 모두 만들 수도 있을까요?</h3>
            <div className={styles.lessonActions}>
              <button
                className={styles.quiet}
                aria-pressed={overlap === true}
                aria-label="그럴 수 있어요"
                data-answer={overlap === true ? "correct" : undefined}
                onClick={() => setOverlap(true)}
              >
                그럴 수 있어요
                {overlap === true && <AnswerMark correct />}
              </button>
              <button
                className={styles.quiet}
                aria-pressed={overlap === false}
                aria-label="반드시 따로 써야 해요"
                data-answer={overlap === false ? "incorrect" : undefined}
                onClick={() => setOverlap(false)}
              >
                반드시 따로 써야 해요
                {overlap === false && <AnswerMark correct={false} />}
              </button>
            </div>
            {overlap !== null && (
              <p role="status" className={styles.quizFeedback}>
                {overlap
                  ? "맞아요. 용도가 겹칠 수 있어요."
                  : "한 도구가 여러 기능을 제공하기도 해요. 작업마다 새 도구를 설치할 필요는 없어요."}
              </p>
            )}
            <div className={styles.preview}>
              <strong>만들 결과 → 필요한 기능 → 사용할 도구</strong>
              <p>
                이 순서로 살펴보세요. 다음 수업은 개인 컴퓨터에서 사용할 도구를 준비하는 단계예요.
                현재 제작 중이며, 설치나 실습을 완료한 것으로 기록하지 않아요.
              </p>
            </div>
          </>
        )}
      </div>
      <aside className={styles.lessonPanel} aria-label="학습 안내">
        <div className={styles.panelNotes}>
          <span className={styles.companion} aria-hidden="true" />
          <span className="label">이번 수업의 목표</span>
          <h2>{lesson === 0 ? "AI의 도움과 확인할 일 구분하기" : "만들 결과에 맞는 기능 찾기"}</h2>
          <p>
            {lesson === 0
              ? "초안은 함께 만들고, 내 작업에 맞는지는 직접 확인해요."
              : "만들 결과 → 필요한 기능 → 사용할 도구 순서로 생각해요."}
          </p>
          <small>개인 컴퓨터에서 실습 · 모바일에서는 복습해요.</small>
        </div>
        <small aria-label="현재 학습 단계">
          {gradual ? `설명 ${part + 1} / 3` : step === 2 ? "핵심 정리와 확인" : "예시 살펴보기"}
        </small>
        <nav className={styles.lessonNavigation} aria-label="수업 진행">
          {(step > 0 || part > 0) && (
            <button
              className={styles.quiet}
              onClick={() => {
                if (gradual && part > 0)
                  setRevealed((previous) => ({ ...previous, [step]: part - 1 }));
                else move(step - 1);
              }}
            >
              이전 설명
            </button>
          )}
          {step < 2 ? (
            <button
              disabled={lesson === 0 && step === 1 && !correct}
              onClick={() => {
                if (gradual && part < 2)
                  setRevealed((previous) => ({ ...previous, [step]: part + 1 }));
                else move(step + 1);
              }}
            >
              다음으로
            </button>
          ) : (
            <button
              disabled={lesson === 1 && !correct}
              onClick={() => {
                onComplete(lesson);
                onBack();
              }}
            >
              {lesson === 0 ? "배운 내용 챙겨 마을로 →" : "배운 내용 챙겨 마을로 →"}
            </button>
          )}
        </nav>
      </aside>
    </section>
  );
}
