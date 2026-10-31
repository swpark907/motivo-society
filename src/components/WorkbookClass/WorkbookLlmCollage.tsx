"use client";

// Client component: the three cards stick on one by one with a replay control,
// like screen 1; reduced-motion users get the finished board at once.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import { useEffect, useId, useState, type CSSProperties } from "react";
import styles from "./WorkbookLlmCollage.module.scss";
import { scissorCut } from "./workbook-collage";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * Names, makers and first public dates, checked against each company's own announcement
 * (OpenAI 2022-11-30 "Introducing ChatGPT", Anthropic 2023-03-14 "Introducing Claude",
 * Google 2023-12-06 "Introducing Gemini"). GPT names the model family; ChatGPT is the service.
 */
const MODELS = [
  { name: "GPT", maker: "OpenAI", first: "2022년 11월 ChatGPT 공개", seed: 13, tilt: -3 },
  { name: "Claude", maker: "Anthropic", first: "2023년 3월 처음 공개", seed: 29, tilt: 2 },
  { name: "Gemini", maker: "Google", first: "2023년 12월 처음 발표", seed: 41, tilt: -1.5 },
] as const;

/** When each piece sticks on (ms). */
const CUE = { cards: [200, 650, 1100], more: 1600, capy: 1900, note: 2200 };
const END = 2300;

/**
 * 1-1 screen 5 (collage): the well-known LLMs.
 * Company names are set in our own type, not their logos (decided: names only).
 */
export function WorkbookLlmCollage() {
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

  const sticker = `sticker-${useId().replace(/:/g, "")}`;
  const on = (ms: number) => (t >= ms ? styles.on : styles.off);

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
              seed="5"
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
        </defs>
      </svg>
      <div className={styles.scene}>
        <h2 id="lesson-screen-title" className={styles.headline}>
          <span style={scissorCut(61, 3, 12)}>많이 쓰는</span>{" "}
          <span style={scissorCut(67, 3, 12)}>대표적인 LLM</span>
        </h2>
        <ul className={styles.cards}>
          {MODELS.map((model, index) => (
            <li
              key={model.name}
              className={`${styles.card} ${on(CUE.cards[index])}`}
              style={{ ...scissorCut(model.seed), "--tilt": `${model.tilt}deg` } as CSSProperties}
            >
              <span className={styles.name} lang="en">
                {model.name}
              </span>
              <span className={`${styles.meta} ${hand.className}`}>
                <span>만든 곳 · {model.maker}</span>
                <span>{model.first}</span>
              </span>
            </li>
          ))}
        </ul>
        <p
          className={`${styles.more} ${hand.className} ${on(CUE.more)}`}
          style={scissorCut(83, 6, 6)}
        >
          이 밖에도 여러 LLM이 있어요
        </p>
        <span
          className={`${styles.capy} ${on(CUE.capy)}`}
          style={{ "--sticker": `url(#${sticker})` } as CSSProperties}
          aria-hidden="true"
        >
          <Image src="/images/workbook/lesson-1-1/capy-back.png" alt="" width={234} height={437} />
        </span>
        <div className={`${styles.note} ${on(CUE.note)}`}>
          <p>
            LLM에는 여러 종류가 있어요. 그중 많이 쓰이는 것이 <strong>GPT, Claude, Gemini</strong>
            예요.
          </p>
          <p>회사마다 따로 만들어서, 잘하는 일과 쓰는 방법이 조금씩 달라요.</p>
          <p>어떤 것을 쓸지는 다음 수업에서 함께 골라 봐요.</p>
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
