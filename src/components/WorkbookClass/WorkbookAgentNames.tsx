"use client";

// Client component: the loop drawing builds itself once in order, and "다시 보기" replays it by
// remounting the drawing. Reduced-motion users get the finished drawing at once (CSS).
import { useState, type CSSProperties } from "react";
import styles from "./WorkbookAgentNames.module.scss";

/** When each piece of the drawing appears (ms), in the order the work actually happens. */
const at = (ms: number) => ({ "--at": `${ms}ms` }) as CSSProperties;

/**
 * Three widely used code agents and who makes them, checked on each official site on 2026-11-15
 * (code.claude.com overview, developers.openai.com/codex, cursor.com). Names only, no logos, no
 * model versions or prices: those change fast, so the screen carries the date.
 */
const AGENTS = [
  { name: "Claude Code", maker: "Anthropic", ours: true },
  { name: "Codex", maker: "OpenAI", ours: false },
  { name: "Cursor", maker: "Anysphere", ours: false },
] as const;

const LOOP = ["말로 부탁해요", "파일이 바뀌어요", "결과를 확인해요"] as const;

/**
 * 1-2 screen 5: the code agents people use now, and the one flow they share.
 * Left: three name tags. Right: a loop drawing — open a folder once, then ask → files change →
 * check → ask again. The drawing is decoration; the same steps are in a real list for readers.
 */
export function WorkbookAgentNames() {
  const [run, setRun] = useState(0);
  return (
    <div data-lesson-wide className={styles.names}>
      <h2 id="lesson-screen-title" className={styles.title}>
        요즘 많이 쓰는 코드 에이전트
      </h2>
      <p className={styles.lead}>
        코드 에이전트도 여러 가지가 있어요. 이름과 화면은 달라도 일하는 흐름은 같아요.
      </p>

      <div className={styles.layout}>
        <div>
          <ul className={styles.tags}>
            {AGENTS.map((agent) => (
              <li key={agent.name} className={agent.ours ? styles.ours : undefined}>
                <span className={styles.hole} aria-hidden="true" />
                <strong lang="en">{agent.name}</strong>
                <span className={styles.maker}>
                  만든 곳 · <span lang="en">{agent.maker}</span>
                </span>
                {agent.ours && <span className={styles.pick}>이 클래스에서 써요</span>}
              </li>
            ))}
          </ul>
          <p className={styles.asOf}>2026년 11월 기준이에요. 이 밖에도 여러 가지가 있어요.</p>
        </div>

        <div className={styles.flow}>
          <svg key={run} viewBox="0 0 360 268" role="presentation" aria-hidden="true">
            <defs>
              <marker
                id="names-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0 0l10 5-10 5z" fill="#2b2925" />
              </marker>
            </defs>
            {/* 들어가는 길: 폴더를 한 번 연다 */}
            <g className={styles.step} style={at(200)}>
              <rect
                x="6"
                y="14"
                width="112"
                height="38"
                rx="6"
                fill="#e8c9a0"
                stroke="#2b2925"
                strokeWidth="1.6"
              />
              <text x="62" y="38" textAnchor="middle" className={styles.entry}>
                폴더를 열어요
              </text>
            </g>
            <path
              d="M118 33h36"
              stroke="#2b2925"
              strokeWidth="2"
              markerEnd="url(#names-arrow)"
              className={styles.link}
              style={at(600)}
            />
            {/* 도는 길: 부탁 → 파일 변경 → 확인 → 다시 부탁 */}
            <g className={`${styles.node} ${styles.step}`} style={at(900)}>
              <rect x="158" y="12" width="124" height="42" rx="21" />
              <text x="220" y="38" textAnchor="middle">
                {LOOP[0]}
              </text>
            </g>
            <path
              d="M262 62c34 34 44 82 22 128"
              className={`${styles.arc} ${styles.link}`}
              style={at(1300)}
              markerEnd="url(#names-arrow)"
            />
            <g className={`${styles.node} ${styles.step}`} style={at(1600)}>
              <rect x="216" y="198" width="132" height="42" rx="21" />
              <text x="282" y="224" textAnchor="middle">
                {LOOP[1]}
              </text>
            </g>
            <path
              d="M214 246c-36 12-76 8-104-6"
              className={`${styles.arc} ${styles.link}`}
              style={at(2000)}
              markerEnd="url(#names-arrow)"
            />
            <g className={`${styles.node} ${styles.step}`} style={at(2300)}>
              <rect x="4" y="198" width="132" height="42" rx="21" />
              <text x="70" y="224" textAnchor="middle">
                {LOOP[2]}
              </text>
            </g>
            <path
              d="M52 190C36 142 62 88 150 58"
              className={`${styles.arc} ${styles.link}`}
              style={at(2700)}
              markerEnd="url(#names-arrow)"
            />
            <g className={styles.link} style={at(3100)}>
              <text x="180" y="132" textAnchor="middle" className={styles.center}>
                마음에 들 때까지
              </text>
              <text x="180" y="154" textAnchor="middle" className={styles.center}>
                다시 부탁해요
              </text>
            </g>
            {/* 한 바퀴 더 도는 점: 고리가 다 그려진 뒤 한 번만 */}
            <circle r="6" className={styles.runner} />
          </svg>
          <button type="button" className={styles.replay} onClick={() => setRun((n) => n + 1)}>
            다시 보기
          </button>
          <ol className={styles.srOnly}>
            <li>폴더를 열어요</li>
            {LOOP.map((step) => (
              <li key={step}>{step}</li>
            ))}
            <li>마음에 들 때까지 다시 부탁해요</li>
          </ol>
        </div>
      </div>

      <p className={styles.closing}>
        이 클래스에서는 <strong>Claude Code</strong>를 써요. 준비는 1-4에서 같이 해요.
      </p>
    </div>
  );
}
