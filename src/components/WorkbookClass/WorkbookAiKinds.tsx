import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import styles from "./WorkbookAiKinds.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * One well-known service per kind. Each was checked on its own official page on 2026-11-13
 * (chatgpt.com, docs.midjourney.com, blog.google "Introducing Flow", meshy.ai,
 * help.figma.com "Explore Figma Sites", code.claude.com). Names change fast (OpenAI's Sora app
 * closed in 2026), so the screen shows the date and docs/product/workbook-unit-1-plan.md keeps
 * the sources. Names are set in our own type, never as logos.
 */
const KINDS: { kind: string; service: string; does: string; art: ReactNode; ours?: true }[] = [
  { kind: "글 · 대화", service: "ChatGPT", does: "묻고 답하며 글을 써요", art: <TextArt /> },
  { kind: "그림", service: "Midjourney", does: "설명한 대로 그림을 그려요", art: <ImageArt /> },
  { kind: "영상", service: "Google Flow", does: "짧은 영상을 만들어요", art: <VideoArt /> },
  { kind: "3D 모델", service: "Meshy", does: "입체 물체를 만들어요", art: <CubeArt /> },
  {
    kind: "웹사이트 빌더",
    service: "Figma Sites",
    does: "화면을 꾸며 사이트로 올려요",
    art: <SiteArt />,
  },
  {
    kind: "코드 에이전트",
    service: "Claude Code",
    does: "파일을 직접 만들고 고쳐요",
    art: <CodeArt />,
    ours: true,
  },
];

/**
 * 1-2 screen 1: what kinds of AI there are, sorted by what they make.
 * A calm board of six paper cards, each led by a scrap of what that kind of AI makes
 * (the napping cat is the drawing from 1-1). Screen 2 is the lesson's big collage scene, so this
 * one stays on the paper page: the cards stick on once in order, then a small capybara sticker
 * points at the code agent card. CSS only; reduced motion shows the finished board.
 */
export function WorkbookAiKinds() {
  return (
    <div data-lesson-wide className={styles.kinds}>
      <h2 id="lesson-screen-title" className={styles.title}>
        무엇을 만들지에 따라 AI가 달라요
      </h2>
      <div className={styles.lead}>
        <p>
          AI는 무엇을 만드느냐에 따라 여러 종류가 있습니다. 글, 그림, 영상, 3D 모델을 만드는 AI도
          있고, 웹사이트를 <span className={styles.nowrap}>버튼 몇 번으로</span> 만들어 주는
          서비스도 있어요.
        </p>
        <p>
          우리는 그중 <strong>코드 에이전트</strong>를 활용해 작업을 진행해보겠습니다!
        </p>
      </div>
      <ul className={styles.cards}>
        {KINDS.map((item, index) => (
          <li
            key={item.kind}
            className={item.ours ? styles.ours : undefined}
            style={{ "--i": index } as CSSProperties}
          >
            <span className={styles.art} aria-hidden="true">
              {item.art}
            </span>
            <span className={styles.kind}>{item.kind}</span>
            <span className={styles.does}>{item.does}</span>
            <span className={styles.service}>
              <span className={styles.serviceLabel}>대표 서비스</span>
              <span lang="en">{item.service}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <p className={styles.asOf}>2026년 11월 기준</p>
        {/* 카피바라(학습자 쪽)가 코드 에이전트 카드를 가리킨다. 같은 말은 위 본문에 글로 있다. */}
        <span className={`${styles.pointer} ${hand.className}`} aria-hidden="true">
          <span className={styles.pointerLabel}>우리는 이걸 써요</span>
          <svg className={styles.arrow} viewBox="0 0 50 50" role="presentation">
            <path
              d="M40 46C38 30 30 16 12 8"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M22 5L12 8l5 9"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <Image
            className={styles.capy}
            src="/images/workbook/lesson-1-1/capy-back.png"
            alt=""
            width={234}
            height={437}
          />
        </span>
      </div>
    </div>
  );
}

/* 결과물 조각: 그 AI가 만드는 것을 작게 그린 종이 그림. 장식이라 화면 읽기에서는 숨긴다. */

const MONO = "ui-monospace, Menlo, monospace";

function TextArt() {
  return (
    <svg viewBox="0 0 160 110" role="presentation">
      <rect x="54" y="10" width="96" height="24" rx="12" fill="#2b2925" />
      <text x="64" y="26" fontSize="10" fill="#f6efe2">
        책방 소개 글 써줘
      </text>
      <rect
        x="10"
        y="44"
        width="124"
        height="56"
        rx="12"
        fill="#fffdf8"
        stroke="#2b2925"
        strokeWidth="1.6"
      />
      <text x="20" y="62" fontSize="9.5" fill="#2b2925">
        창가 자리에 앉아 천천히
      </text>
      <text x="20" y="76" fontSize="9.5" fill="#2b2925">
        책을 읽을 수 있는 작은
      </text>
      <text x="20" y="90" fontSize="9.5" fill="#2b2925">
        동네 책방이에요.
      </text>
    </svg>
  );
}

/** The napping cat from 1-1 screen 1, so the lesson keeps one thread of examples. */
function ImageArt() {
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

/** Three frames of a film strip: the sun sets across them. */
function VideoArt() {
  const holes = [10, 30, 50, 70, 90, 110, 130, 150];
  return (
    <svg viewBox="0 0 160 110" role="presentation">
      <rect x="0" y="14" width="160" height="82" fill="#2b2925" />
      {holes.map((x) => (
        <rect key={`t${x}`} x={x - 4} y="18" width="8" height="6" rx="1" fill="#f6efe2" />
      ))}
      {holes.map((x) => (
        <rect key={`b${x}`} x={x - 4} y="86" width="8" height="6" rx="1" fill="#f6efe2" />
      ))}
      {[0, 1, 2].map((frame) => (
        <g key={frame} transform={`translate(${6 + frame * 50} 30)`}>
          <rect width="46" height="50" fill={["#e8c9a0", "#e6b083", "#c98a6a"][frame]} />
          <circle cx="23" cy={14 + frame * 9} r="7" fill="#f2c25b" />
          <rect y="36" width="46" height="14" fill="#6f8f8a" />
        </g>
      ))}
    </svg>
  );
}

/** A small armchair as a 3D model, with its shadow and a turn arrow. */
function CubeArt() {
  return (
    <svg viewBox="0 0 160 110" role="presentation">
      <ellipse cx="80" cy="94" rx="44" ry="8" fill="#d9d2c3" />
      <path d="M50 40l30-14 30 14-30 14z" fill="#f3e3c4" stroke="#2b2925" strokeWidth="1.6" />
      <path d="M50 40v36l30 14V54z" fill="#c9a77c" stroke="#2b2925" strokeWidth="1.6" />
      <path d="M110 40v36L80 90V54z" fill="#8f6e4c" stroke="#2b2925" strokeWidth="1.6" />
      <path
        d="M122 22a26 12 0 0 1 8 18"
        stroke="#2b2925"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M126 38l4 3 3-5" stroke="#2b2925" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

/** A tiny finished website: menu, big picture, title and buttons. */
function SiteArt() {
  return (
    <svg viewBox="0 0 160 110" role="presentation">
      <rect x="8" y="6" width="144" height="98" fill="#fffdf8" stroke="#2b2925" strokeWidth="1.6" />
      <path d="M8 18h144" stroke="#2b2925" strokeWidth="1.6" />
      <circle cx="15" cy="12" r="2" fill="#2b2925" />
      <circle cx="22" cy="12" r="2" fill="#2b2925" />
      <rect x="16" y="24" width="128" height="40" fill="#bcd6d9" />
      <circle cx="122" cy="36" r="7" fill="#f2c25b" />
      <path d="M16 64l30-22 20 14 16-10 62 18z" fill="#7d9a6e" />
      <text x="16" y="80" fontSize="10" fontWeight="700" fill="#2b2925">
        창가 책방
      </text>
      <rect x="16" y="86" width="34" height="11" rx="2" fill="#2b2925" />
      <rect x="54" y="86" width="34" height="11" rx="2" fill="none" stroke="#2b2925" />
    </svg>
  );
}

/** A project folder with its files, and the page the agent just opened. */
function CodeArt() {
  return (
    <svg viewBox="0 0 160 110" role="presentation">
      <path d="M6 14h34l6 7h44v72H6z" fill="#e8c9a0" stroke="#2b2925" strokeWidth="1.6" />
      <text x="12" y="34" fontFamily={MONO} fontSize="8" fill="#2b2925">
        my-site
      </text>
      <rect x="12" y="42" width="70" height="14" fill="#fffdf8" stroke="#2b2925" />
      <text x="17" y="52" fontFamily={MONO} fontSize="7.5" fill="#2b2925">
        index.html
      </text>
      <rect x="12" y="60" width="70" height="14" fill="#fffdf8" stroke="#2b2925" />
      <text x="17" y="70" fontFamily={MONO} fontSize="7.5" fill="#2b2925">
        style.css
      </text>
      <rect
        x="94"
        y="30"
        width="60"
        height="64"
        fill="#fffdf8"
        stroke="#2b2925"
        strokeWidth="1.6"
      />
      <path d="M94 40h60" stroke="#2b2925" strokeWidth="1.6" />
      <text x="100" y="56" fontSize="8" fontWeight="700" fill="#2b2925">
        안녕하세요
      </text>
      <path d="M100 66h44M100 74h30" stroke="#d9d2c3" strokeWidth="4" strokeLinecap="round" />
      <path d="M84 50l8 0" stroke="#2b2925" strokeWidth="1.6" />
      <path d="M89 47l3 3-3 3" stroke="#2b2925" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
