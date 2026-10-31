"use client";

// Client component: the collage plays a short build (cards stick on, the capybara reacts),
// with a replay control; reduced-motion users get the finished board at once.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { useEffect, useId, useState, type CSSProperties } from "react";
import styles from "./WorkbookAiEraCollage.module.scss";
import { scissorCut } from "./workbook-collage";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/** When each piece sticks on (ms). */
const CUE = {
  first: 200,
  firstLabel: 700,
  puzzled: 1100,
  second: 2200,
  secondResult: 2800,
  aha: 3300,
  note: 3600,
};
const END = 3700;

/**
 * 1-1 screen 1 (collage draft): "AI that picks" vs "AI that makes".
 * The whole lesson body is the stage: the title is pasted on as newspaper strips and the
 * explanation as a paper note, both real text over the decorative scene.
 * The capybara stands in for the learner: from behind it tilts its head at the first card,
 * then turns with a light bulb at the second.
 */
export function WorkbookAiEraCollage() {
  const [t, setT] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setT(END));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const next = Math.min(END, now - start);
      setT(next);
      if (next < END) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [run]);

  // SVG filter ids for the thick sticker border and the hand-drawn wobble.
  const uid = useId().replace(/:/g, "");
  const sticker = `sticker-${uid}`;
  const wobble = `wobble-${uid}`;
  const at = (ms: number) => t >= ms;
  const on = (ms: number) => (at(ms) ? styles.on : styles.off);
  const aha = at(CUE.aha);

  return (
    <figure className={styles.board} aria-labelledby="lesson-screen-title" data-wide-scene>
      <svg className={styles.defs} aria-hidden="true" focusable="false">
        <defs>
          {/* 종이에서 오려낸 스티커: 두껍고 살짝 울퉁불퉁한 흰 테두리 */}
          <filter id={sticker} x="-25%" y="-25%" width="150%" height="150%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="thick" />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05"
              numOctaves="2"
              seed="3"
              result="noise"
            />
            <feDisplacementMap
              in="thick"
              in2="noise"
              scale="7"
              xChannelSelector="R"
              yChannelSelector="G"
              result="rough"
            />
            <feFlood floodColor="#fffaf0" />
            <feComposite in2="rough" operator="in" result="border" />
            <feMerge>
              <feMergeNode in="border" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* 손으로 그린 선처럼 살짝 흔들기 */}
          <filter id={wobble}>
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
        </defs>
      </svg>
      <div className={styles.scene}>
        <h2 id="lesson-screen-title" className={styles.headline}>
          <span style={scissorCut(71, 3, 12)}>AI가 하는 일이</span>
          <span style={scissorCut(83, 3, 12)}>달라졌어요</span>
        </h2>
        <div
          className={`${styles.stage} ${hand.className}`}
          style={
            { "--sticker": `url(#${sticker})`, "--wobble": `url(#${wobble})` } as CSSProperties
          }
          aria-hidden="true"
        >
          {/* 고르는 AI: 신문 같은 흑백 망점 사진 + 오렌지 색 종이 */}
          <div
            className={`${styles.card} ${styles.cardPick} ${on(CUE.first)}`}
            style={scissorCut(11)}
          >
            <span className={styles.tag}>판단하는 AI</span>
            <div className={styles.photoWrap}>
              <span className={styles.spot} style={scissorCut(23, 6, 6)} />
              <div className={styles.photo}>
                <CatPhoto />
              </div>
            </div>
            <span className={`${styles.answer} ${on(CUE.firstLabel)}`} style={scissorCut(31, 8, 5)}>
              고양이예요
            </span>
            <span className={styles.hint}>판단해서 답해요</span>
          </div>

          {/* 만드는 AI: 손그림 말풍선 + 새로 그린 그림 */}
          <div
            className={`${styles.card} ${styles.cardMake} ${on(CUE.second)}`}
            style={scissorCut(47)}
          >
            <span className={styles.tag}>만드는 AI</span>
            <span className={styles.bubble}>창가에서 낮잠 자는 고양이를 그려줘</span>
            <div className={`${styles.drawing} ${on(CUE.secondResult)}`}>
              <CatDrawing />
            </div>
            <span className={styles.hint}>새로 만들어요</span>
          </div>

          {/* 카피바라: 가위로 자른 골판지 위에 두꺼운 흰 테두리 스티커 */}
          <div className={`${styles.capy} ${on(CUE.puzzled)}`}>
            <span className={styles.backing} style={scissorCut(59, 7, 6)} />
            {/* 확정 캐릭터 시트의 뒷모습(카드를 보며 갸웃) → 3/4 모습(돌아보며 반짝). */}
            <Image
              src={
                aha
                  ? "/images/workbook/lesson-1-1/capy-turn.png"
                  : "/images/workbook/lesson-1-1/capy-back.png"
              }
              alt=""
              width={aha ? 236 : 234}
              height={aha ? 435 : 437}
              className={`${styles.capyImage} ${aha ? "" : styles.tilted}`}
            />
            <span className={`${styles.thought} ${aha ? styles.off : on(CUE.puzzled)}`}>
              <QuestionMark />
            </span>
            <span className={`${styles.thought} ${styles.bulb} ${on(CUE.aha)}`}>
              <LightBulb />
            </span>
          </div>
        </div>
        <div className={`${styles.note} ${on(CUE.note)}`}>
          <p>
            예전에 많이 쓰던 AI는 분석하고 판단하는 데 쓰였어요. 사진 속 동물이 무엇인지, 이 메일이
            스팸인지처럼 정확한 답을 내는 게 목적이었죠.
          </p>
          <p>
            하지만 요즘 많이 쓰는 AI는 부탁을 받으면{" "}
            <span className={styles.nowrap}>글·그림·코드를</span> 새로 만들어요.
          </p>
          <p>
            이런 AI를 <strong>생성형 AI</strong>라고 해요.
          </p>
        </div>
      </div>
      <div className={styles.caption}>
        <button type="button" className={styles.replay} onClick={() => setRun((n) => n + 1)}>
          다시 보기
        </button>
      </div>
    </figure>
  );
}

/** A paper-cut "photo" of a sitting cat. */
function CatPhoto() {
  return (
    <svg viewBox="0 0 120 90" role="presentation">
      <rect width="120" height="90" fill="#6f6a61" />
      <rect y="62" width="120" height="28" fill="#5a554d" />
      <path d="M44 72c-6-14-2-30 10-36l-2-12 9 8h10l9-8-2 12c12 6 16 22 10 36z" fill="#2b2925" />
      <path
        d="M86 70c10-2 16-10 12-18"
        stroke="#2b2925"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="58" cy="44" r="2.4" fill="#e9e2d2" />
      <circle cx="70" cy="44" r="2.4" fill="#e9e2d2" />
    </svg>
  );
}

/** A paper-cut drawing: a cat napping on a sunny windowsill. */
function CatDrawing() {
  return (
    <svg viewBox="0 0 120 90" role="presentation">
      <rect width="120" height="90" fill="#f3e3c4" />
      <rect x="14" y="8" width="92" height="52" fill="#bcd6d9" />
      <path d="M60 8v52M14 34h92" stroke="#f3e3c4" strokeWidth="5" />
      <circle cx="88" cy="22" r="8" fill="#f2c25b" />
      <rect x="6" y="60" width="108" height="10" fill="#b5764f" />
      <path d="M30 60c0-12 10-18 24-18s26 4 30 12l8-6v12z" fill="#e08a4b" />
      <path d="M38 52l4-6M48 50l3-7" stroke="#b5764f" strokeWidth="2" />
      <path d="M78 50l-3-8 7 4M90 50l2-8-7 4" fill="#e08a4b" />
      <path d="M80 52q3 2 6 0" stroke="#5a3a26" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

function QuestionMark() {
  return (
    <svg viewBox="0 0 40 40" role="presentation">
      <circle cx="20" cy="20" r="18" fill="#f6efe2" />
      <path
        d="M14 15c0-5 4-8 7-8s7 3 7 7c0 5-7 6-7 11"
        stroke="#2b2925"
        strokeWidth="3.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="21" cy="31" r="2.2" fill="#2b2925" />
    </svg>
  );
}

function LightBulb() {
  return (
    <svg viewBox="0 0 48 48" role="presentation">
      <path
        d="M24 2v6M8 10l4 4M40 10l-4 4M2 26h6M40 26h6"
        stroke="#f2c25b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 12c-8 0-13 6-13 13 0 5 3 8 6 11v4h14v-4c3-3 6-6 6-11 0-7-5-13-13-13z"
        fill="#f2c25b"
      />
      <rect x="17" y="40" width="14" height="5" rx="1" fill="#6f6a61" />
    </svg>
  );
}
