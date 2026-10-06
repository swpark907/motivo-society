"use client";

// 사용자가 대사를 넘기는 컷씬과 정지 가능한 보행 소개를 담당한다.
import { useRef, useState } from "react";
import styles from "./WorkbookClass.module.scss";

const dialogue = [
  {
    panel: 0,
    speaker: "전화 너머 친구",
    text: "전에 보여준 돌 쌓는 거, 어디서 다시 해볼 수 있어?",
    alt: "작업실에서 친구의 전화를 받는 카피바라",
  },
  {
    panel: 0,
    speaker: "카피바라",
    text: "잠깐만! 차 마시는 건 여기고… 돌 정원 링크는 어디 뒀더라?",
    alt: "전화기를 들고 작업을 떠올리는 카피바라",
  },
  {
    panel: 1,
    speaker: "카피바라",
    text: "만든 건 몇 개 있는데, 링크도 설명도 여기저기 흩어져 있네.",
    alt: "노트북 앞에서 흩어진 메모를 찾는 카피바라",
  },
  {
    panel: 1,
    speaker: "전화 너머 친구",
    text: "한곳에서 보고 바로 해볼 수 있으면 좋겠다. 다른 친구에게도 보여주고 싶어!",
    alt: "차와 돌 정원 작업 화면을 띄운 노트북과 메모들",
  },
  {
    panel: 2,
    speaker: "카피바라",
    text: "좋아. 내가 만든 작은 쉼들을 모아둘 홈페이지를 만들어보자.",
    alt: "배낭 끈을 잡고 작업실 문 앞에 선 카피바라",
  },
  {
    panel: 2,
    speaker: "카피바라",
    text: "그런데… 누구에게 무엇부터 보여주면 좋을까? 같이 찾아볼래?",
    alt: "마을로 떠날 준비를 마친 카피바라",
  },
];

export function WorkbookIntro({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(-1);
  const [paused, setPaused] = useState(false);
  const speech = useRef<HTMLParagraphElement>(null);
  function move(next: number) {
    setStep(next);
    requestAnimationFrame(() => speech.current?.focus());
  }
  const line = step < 0 ? null : dialogue[step];
  return (
    <div className={styles.introPlayer}>
      {!line ? (
        <div className={styles.introWelcome}>
          <div className={styles.spriteArea}>
            <div
              className={styles.walkSprite}
              data-paused={paused}
              role="img"
              aria-label="양손으로 배낭 끈을 잡고 제자리에서 걷는 카피바라"
            />
            <button
              className={styles.quiet}
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              {paused ? "걷기 재생" : "걷기 멈추기"}
            </button>
          </div>
          <div>
            <span className="label">YOUR TRAVEL COMPANION</span>
            <h2>작은 쉼을 만드는 친구</h2>
            <p ref={speech} tabIndex={-1}>
              안녕. 나는 잠깐 쉬어갈 수 있는 작은 웹을 만들어.
            </p>
            <p>
              차를 따르고, 숨을 고르고, 돌을 쌓는 시간.
              <br />
              오늘은 내가 만든 것들을 모아둘 공간을 만들려고 해.
            </p>
            <div className={styles.tokens}>
              <span>차 한 잔</span>
              <span>숨 고르기</span>
              <span>돌 정원</span>
            </div>
            <small>카피바라 이야기 속 작업들이에요.</small>
            <button onClick={() => move(0)}>어쩌다 시작하게 됐냐면…</button>
          </div>
        </div>
      ) : (
        <div className={styles.cutscene}>
          <div
            className={styles.sceneArt}
            role="img"
            aria-label={line.alt}
            style={{ backgroundPosition: `${line.panel * 50}% center` }}
          />
          <div className={styles.dialogueBox}>
            <div className={styles.top}>
              <strong>{line.speaker}</strong>
              <span>
                장면 {line.panel + 1} / 3 · 대화 {step + 1} / {dialogue.length}
              </span>
            </div>
            <p ref={speech} tabIndex={-1} className={styles.speech}>
              {line.text}
            </p>
            <div className={styles.dialogueActions}>
              <button className={styles.quiet} onClick={() => move(step - 1)}>
                {step === 0 ? "캐릭터 소개로" : "이전 대화"}
              </button>
              {step < dialogue.length - 1 ? (
                <button onClick={() => move(step + 1)}>다음 대화 →</button>
              ) : (
                <button onClick={onComplete}>한곳에 모아볼까?</button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={styles.dialogueActions}>
        <button className={styles.quiet} onClick={onComplete}>
          이야기 건너뛰기
        </button>
        {line && (
          <button className={styles.quiet} onClick={() => move(-1)}>
            처음부터 다시보기
          </button>
        )}
      </div>
    </div>
  );
}
