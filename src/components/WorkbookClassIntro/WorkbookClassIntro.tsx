"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { WorkbookIntroSprite } from "@/components/WorkbookIntroSprite/WorkbookIntroSprite";
import { workbookCourse } from "@/lib/workbook-course";
import { LAPTOP, SCENE } from "@/lib/workbook-intro-sprite";
import { JourneyGrowthReel, JOURNEY_REEL_END_SECONDS } from "./JourneyGrowthReel";
import { isIgnoredKey } from "./useReelKeyboard";
import { WebPossibilitiesReel, WEB_REEL_END_SECONDS } from "./WebPossibilitiesReel";
import styles from "./WorkbookClassIntro.module.scss";

const titles = ["환영", "웹으로 어디까지", "함께할 여정", "준비하고 시작하기"];

/** The last intro scene; returning from the first lesson reopens here. */
export const INTRO_LAST_STEP = titles.length - 1;

const GROW_MS = 750;

const FIRST_LESSON = workbookCourse[0].lessons[0];

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
  exitLabel = "← 단원 지도 보기",
  initialStep = 0,
}: {
  onStart?: () => void;
  onExit?: () => void;
  /** Where the exit link above the intro goes (class page or unit map). */
  exitLabel?: string;
  initialStep?: number;
}) {
  const [step, setStep] = useState(Math.min(initialStep, INTRO_LAST_STEP));
  // Scene 2 opens from the start going forward and at its last frame coming back.
  const [reelStart, setReelStart] = useState(0);
  // Scene 3 likewise reopens at its last frame when coming back from scene 4.
  const [journeyStart, setJourneyStart] = useState(0);
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
    setJourneyStart(next === 2 && step > 2 ? JOURNEY_REEL_END_SECONDS : 0);
    stage.current?.scrollTo({ top: 0 });
    setStep(next);
    requestAnimationFrame(() => content.current?.focus({ preventScroll: true }));
  }

  // ←/→ also move between scenes. Scenes 1 and 4 have no reel, so the intro listens itself;
  // the reel scenes (2·3) step through their own parts first and hand over at either end.
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  });
  useEffect(() => {
    if (step !== 0 && step !== INTRO_LAST_STEP) return;
    function onKey(event: KeyboardEvent) {
      if (growing || isIgnoredKey(event)) return;
      if (event.key === "ArrowRight" && step < INTRO_LAST_STEP) {
        event.preventDefault();
        goRef.current(step + 1);
      } else if (event.key === "ArrowLeft" && step > 0) {
        event.preventDefault();
        goRef.current(step - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, growing]);

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
            WEB CLASS <i /> 클래스 인트로
          </span>
          <span>
            {String(step + 1).padStart(2, "0")} <em>/</em> {String(titles.length).padStart(2, "0")}
          </span>
        </div>
        {onExit && (
          <button className={styles.exit} onClick={onExit}>
            {exitLabel}
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
                onPrev={() => go(0)}
                onNext={() => go(2)}
                browserRef={reelBrowser}
              />
            </div>
          )}
          {step === 2 && (
            <div className={styles.reelStage} ref={content} tabIndex={-1}>
              <JourneyGrowthReel
                key={journeyStart}
                startAt={journeyStart}
                paused={journeyStart > 0}
                onPrev={() => go(1)}
                onNext={() => go(3)}
              />
            </div>
          )}
          <div
            className={`${styles.content} ${step === 1 || step === 2 ? styles.unused : ""}`}
            ref={step === 1 || step === 2 ? undefined : content}
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
            {step === 3 && (
              // 마지막 장면: 문구와 준비물이 차례로 올라오고 준비물 밑줄이 그어진다(.ready).
              <div className={styles.ready}>
                <span className={styles.eyebrow}>READY WHEN YOU ARE</span>
                <h1>
                  준비하고,
                  <br />
                  <span>함께 시작해볼까요?</span>
                </h1>
                <p className={styles.lead}>시작하기 전에 준비할 것은 세 가지예요.</p>
                <ul className={styles.checklist}>
                  <li>
                    <b>01</b> 컴퓨터 <small>Windows 또는 Mac</small>
                  </li>
                  <li>
                    <b>02</b> 인터넷
                  </li>
                  <li>
                    <b>03</b> AI 도구 계정{" "}
                    <small>없다면 1단원에서 도구를 준비할 때 함께 만들어요</small>
                  </li>
                </ul>
                <div className={styles.note}>
                  <span>첫 수업 · {FIRST_LESSON.number}</span>
                  <strong>{FIRST_LESSON.title}</strong>
                  <p>설치 없이 워크북 안에서, 짧은 예시로 AI가 무엇을 하는지 알아봐요.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <nav className={styles.footer} aria-label="인트로 장면 이동">
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0 || growing}
            aria-keyshortcuts="ArrowLeft"
          >
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
            <button
              className={styles.next}
              onClick={() => go(step + 1)}
              disabled={growing}
              aria-keyshortcuts="ArrowRight"
            >
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
