"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { WorkbookIntroSprite } from "@/components/WorkbookIntroSprite/WorkbookIntroSprite";
import { LAPTOP, SCENE } from "@/lib/workbook-intro-sprite";
import { WebPossibilitiesReel, WEB_REEL_END_SECONDS } from "./WebPossibilitiesReel";
import styles from "./WorkbookClassIntro.module.scss";

const titles = ["환영", "웹으로 어디까지", "함께할 여정", "준비하고 시작하기"];

/** The last intro scene; returning from the first lesson reopens here. */
export const INTRO_LAST_STEP = titles.length - 1;

const GROW_MS = 750;

type Box = { left: number; top: number; width: number; height: number };

/** Where the laptop sits on screen inside the sprite canvas (drawn with object-fit: contain, centered). */
function laptopBox(canvas: HTMLCanvasElement): Box | null {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const scale = Math.min(rect.width / SCENE.width, rect.height / SCENE.height);
  const left = rect.left + (rect.width - SCENE.width * scale) / 2;
  const top = rect.top + (rect.height - SCENE.height * scale) / 2;
  return {
    left: left + LAPTOP.x * scale,
    top: top + LAPTOP.y * scale,
    width: LAPTOP.width * scale,
    height: LAPTOP.height * scale,
  };
}

const toBox = (rect: DOMRect): Box => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
});

export function WorkbookClassIntro({
  onStart,
  onExit,
  initialStep = 0,
}: {
  onStart?: () => void;
  onExit?: () => void;
  initialStep?: number;
}) {
  const [step, setStep] = useState(Math.min(initialStep, INTRO_LAST_STEP));
  // Scene 2 opens from the start going forward and at its last frame coming back.
  const [reelStart, setReelStart] = useState(0);
  // While the browser window grows out of the laptop, scene 2 waits hidden underneath.
  const [seed, setSeed] = useState<Box | null>(null);
  const growing = seed !== null;
  const content = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const characterCanvas = useRef<HTMLCanvasElement>(null);
  const reelBrowser = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onStart) content.current?.focus({ preventScroll: true });
  }, [onStart]);

  useEffect(() => {
    if (!growing) return;
    // A short delay lets the start position paint before the window grows
    // (timers also run where animation frames are throttled).
    const grow = window.setTimeout(() => {
      const rect = reelBrowser.current?.getBoundingClientRect();
      if (rect) setSeed(toBox(rect));
    }, 32);
    const done = window.setTimeout(() => setSeed(null), GROW_MS + 32);
    return () => {
      window.clearTimeout(grow);
      window.clearTimeout(done);
    };
  }, [growing]);

  const hasCharacter = step === 0 || step === INTRO_LAST_STEP;

  function go(next: number) {
    if (next === 1 && step === 0) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const from = characterCanvas.current ? laptopBox(characterCanvas.current) : null;
      if (!reduced && from) setSeed(from);
    }
    setReelStart(next === 1 && step > 1 ? WEB_REEL_END_SECONDS : 0);
    stage.current?.scrollTo({ top: 0 });
    setStep(next);
    requestAnimationFrame(() => content.current?.focus({ preventScroll: true }));
  }

  return (
    <main className={`${styles.page} ${onStart ? styles.embedded : ""}`}>
      {!onStart && (
        <header className={styles.header}>
          <span className={styles.brand}>
            motivo <b>society</b>
          </span>
          <span className={styles.headerCenter}>WORKBOOK / WEB CLASS</span>
          <span className={styles.preview}>INTRO PREVIEW</span>
        </header>
      )}
      <div className={styles.shell}>
        <div className={styles.topline}>
          <span>
            1-1-1 <i /> 강의 인트로
          </span>
          <span>
            {String(step + 1).padStart(2, "0")} <em>/</em> {String(titles.length).padStart(2, "0")}
          </span>
        </div>
        {onExit && (
          <button className={styles.exit} onClick={onExit}>
            ← 단원 지도 보기
          </button>
        )}
        <div
          ref={stage}
          className={`${styles.stage} ${hasCharacter ? styles.withCharacter : styles.wide}`}
        >
          {hasCharacter && (
            <aside className={styles.character}>
              {/* The greeting plays on the first scene only; the last scene shows the study loop. */}
              <WorkbookIntroSprite key={step} intro={step === 0} fill canvasRef={characterCanvas} />
              <div className={styles.imageCaption}>
                <span>LET’S BEGIN TOGETHER</span>
                <span>01 / INTRO</span>
              </div>
            </aside>
          )}
          {step === 1 && (
            // Kept outside .content so the intro's large text styles don't reach scene 2.
            <div
              className={`${styles.reelStage} ${growing ? styles.waiting : ""}`}
              ref={content}
              tabIndex={-1}
            >
              <WebPossibilitiesReel
                key={reelStart}
                inStage
                startAt={reelStart}
                paused={reelStart > 0}
                hold={growing}
                browserRef={reelBrowser}
              />
            </div>
          )}
          <div
            className={`${styles.content} ${step === 1 ? styles.unused : ""}`}
            ref={step === 1 ? undefined : content}
            tabIndex={-1}
          >
            {step === 0 && (
              <>
                <span className={styles.eyebrow}>WELCOME TO THE CLASS</span>
                <h1>
                  반가워요.
                  <br />
                  <span>
                    AI와 함께 나만의 웹사이트를 만들어봐요.
                    <i className={styles.caret} aria-hidden />
                  </span>
                </h1>
                <p className={styles.lead}>
                  코딩, 말은 들어봤는데 어디서부터 시작해야 할지 막막하셨죠?
                </p>
                <p>
                  괜찮아요. AI가 무엇인지 알아보는 것부터 AI에게 부탁하고, 결과를 확인하고, 나만의
                  홈페이지를 만드는 것까지. 그 모든 과정을 함께 해볼 거예요.
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <span className={styles.eyebrow}>THE JOURNEY AHEAD</span>
                <h1>
                  하나의 프로젝트를
                  <br />
                  <span>함께 만들어가는 여정.</span>
                </h1>
                <p className={styles.lead}>
                  AI를 이해하고 사용하는 방법부터 시작해, 만들고 싶은 것을 구상하고, 직접 만들고,
                  배포하여 다른 사람에게 보여주기까지 차근차근 함께합니다.
                </p>
                <div className={styles.journey}>
                  {[
                    ["01", "AI 이해하기"],
                    ["02", "아이디어 구상"],
                    ["03", "직접 만들기"],
                    ["04", "배포하고 공유하기"],
                  ].map(([n, label]) => (
                    <div key={n}>
                      <small>{n}</small>
                      <strong>{label}</strong>
                      <span>↗</span>
                    </div>
                  ))}
                </div>
                <p className={styles.fine}>같은 프로젝트를 기획하고, 만들고, 조금씩 발전시켜요.</p>
                {onStart && (
                  <p className={styles.fine}>
                    현재 공개 체험의 배포 단원은 개념을 살펴보는 과정이며, 실제 배포와 공유는
                    제공하지 않아요.
                  </p>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <span className={styles.eyebrow}>READY WHEN YOU ARE</span>
                <h1>
                  준비하고,
                  <br />
                  <span>함께 시작해볼까요?</span>
                </h1>
                <p className={styles.lead}>
                  여정을 시작하기 위한 준비물은 컴퓨터(노트북)와 인터넷, 두 가지면 충분합니다.
                </p>
                <div className={styles.checklist}>
                  <div>
                    <b>01</b> 컴퓨터 (노트북)
                  </div>
                  <div>
                    <b>02</b> 인터넷
                  </div>
                </div>
                <p>나머지는 강의를 따라가며 함께 준비해봐요.</p>
                <div className={styles.note}>
                  <strong>그럼, 함께 시작해볼까요?</strong>
                </div>
              </>
            )}
          </div>
        </div>
        <nav className={styles.footer} aria-label="인트로 장면 이동">
          <button onClick={() => go(step - 1)} disabled={step === 0 || growing}>
            ← <span>이전</span>
          </button>
          <div className={styles.dots}>
            {titles.map((title, index) => (
              <button
                key={title}
                className={index === step ? styles.active : ""}
                onClick={() => go(index)}
                disabled={growing}
                aria-label={`${index + 1}. ${title}`}
                aria-current={index === step ? "step" : undefined}
              />
            ))}
          </div>
          {step < INTRO_LAST_STEP ? (
            <button className={styles.next} onClick={() => go(step + 1)} disabled={growing}>
              {step === 0 ? "웹으로 뭘 만들 수 있을까요?" : "다음으로"} <span>→</span>
            </button>
          ) : onStart ? (
            <button className={styles.next} onClick={onStart}>
              첫 수업 시작 <span>→</span>
            </button>
          ) : (
            <button className={styles.next} onClick={() => go(0)}>
              인트로 다시 보기 <span>↺</span>
            </button>
          )}
        </nav>
      </div>
      {seed && (
        <div className={styles.seed} style={seed as CSSProperties} aria-hidden>
          <span className={styles.seedChrome}>
            <i />
            <i />
            <i />
          </span>
        </div>
      )}
    </main>
  );
}
