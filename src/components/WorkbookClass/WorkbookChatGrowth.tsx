"use client";

// Client component: a short chat plays like a real one. The capybara's request appears,
// the AI "writes" for about two seconds, then the reply lands and the small page beside it
// reloads with the change marked. Finished turns are kept in the visit's lesson state.
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./WorkbookChatGrowth.module.scss";
import { useWorkbookLessonState } from "./useWorkbookLessonState";

const TURNS = [
  {
    request: "창가 책방 소개 페이지 만들어줘. 제목이랑 소개 한 줄이면 돼.",
    reply: "제목과 소개 한 줄로 만들었어요.",
  },
  {
    request: "소개 아래에 여는 시간도 넣어줘. 평일 오전 10시부터 밤 9시까지야.",
    reply: "소개 아래에 여는 시간을 추가했어요.",
  },
  {
    request: "글씨가 좀 작아. 소개 글을 조금 키워줘.",
    reply: "소개 글 크기를 키웠어요.",
  },
] as const;

/** How long the AI "writes" before replying, and how long the page takes to reload (ms). */
const WRITING = 2000;
const RELOADING = 700;

type Pending = { turn: number; phase: "writing" | "reloading" };

/**
 * 1-1 screen 3: a page is not finished in one go.
 * The capybara (the learner's side) asks, sees the result, and asks for changes;
 * the page next to the chat grows with each turn.
 */
export function WorkbookChatGrowth() {
  const [shown, setShown] = useWorkbookLessonState("ai-0-chatTurn", 0);
  const done = Math.min(Math.max(shown, 0), TURNS.length);
  // 처음 들어오면 첫 요청부터 재생한다. 이미 본 대화는 다시 재생하지 않는다.
  const [pending, setPending] = useState<Pending | null>(() =>
    done === 0 ? { turn: 1, phase: "writing" } : null,
  );
  // 방금 바뀐 결과 화면의 차례. 바뀐 곳만 잠깐 표시한다.
  const [fresh, setFresh] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  /** Plays one turn after its request is on screen: writing → reply and reload → new page. */
  const play = useCallback(
    (turn: number) => {
      clearTimers();
      timers.current.push(
        window.setTimeout(() => setPending({ turn, phase: "reloading" }), WRITING),
        window.setTimeout(() => {
          setPending(null);
          setShown(turn);
          setFresh(turn);
        }, WRITING + RELOADING),
      );
    },
    [setShown],
  );
  const ask = (turn: number) => {
    setFresh(0);
    setPending({ turn, phase: "writing" });
    play(turn);
  };

  useEffect(() => {
    // 첫 진입 때 미리 띄운 첫 요청을 이어서 재생한다.
    if (pending?.phase === "writing") play(pending.turn);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 화면에 들어올 때 한 번만
  }, []);

  const asking = pending?.turn ?? 0;
  const replied = pending?.phase === "reloading";
  const page = done;
  const visible = TURNS.slice(0, Math.max(done, asking));

  return (
    <div className={styles.screen} data-lesson-wide>
      <p>
        웹페이지는 한 번의 요청으로 완성되지 않아요. 결과를 보고, 고칠 곳을 말하고, 다시 확인하며
        조금씩 만들어 가요.
      </p>
      <div className={styles.scene}>
        <ol className={styles.chat} aria-label="카피바라와 AI의 대화">
          {visible.map((item, index) => {
            const current = index + 1 === asking;
            return (
              <li key={item.request} className={styles.turn}>
                <div className={`${styles.request} ${current ? styles.enter : ""}`}>
                  <span className={styles.avatar}>
                    <Image
                      src="/images/workbook/lesson-1-1/capy-turn.png"
                      alt="카피바라"
                      width={236}
                      height={435}
                    />
                  </span>
                  <p>{item.request}</p>
                </div>
                <div className={styles.reply}>
                  <span className={styles.aiMark} role="img" aria-label="AI">
                    <RobotFace />
                  </span>
                  {current && !replied ? (
                    <p className={styles.writing} role="status" aria-label="AI가 답을 쓰고 있어요">
                      <span />
                      <span />
                      <span />
                    </p>
                  ) : (
                    <p className={current ? styles.enter : ""}>{item.reply}</p>
                  )}
                </div>
                {index < visible.length - 1 && (
                  <span className={styles.divider} aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
        <div className={styles.side}>
          <div
            className={`${styles.browser} ${replied ? styles.reloading : ""}`}
            aria-live="polite"
            aria-busy={replied}
            aria-label={page ? `${page}번째 결과 화면` : "아직 빈 결과 화면"}
          >
            <span className={styles.address} aria-hidden="true">
              index.html{page ? ` · ${page}번째 결과` : ""}
              <span className={styles.progress} />
            </span>
            <div className={styles.page}>
              {page === 0 ? (
                <p className={styles.empty}>아직 빈 페이지예요</p>
              ) : (
                <>
                  <p className={`${styles.pageTitle} ${fresh === 1 ? styles.fresh : ""}`}>
                    창가 책방
                  </p>
                  <p
                    className={`${styles.pageIntro} ${page >= 3 ? styles.bigger : ""} ${fresh === 1 || fresh === 3 ? styles.fresh : ""}`}
                  >
                    창가 자리에서 혼자 조용히 책 읽기 좋은 동네 책방이에요.
                  </p>
                  {page >= 2 && (
                    <p className={`${styles.pageHours} ${fresh === 2 ? styles.fresh : ""}`}>
                      평일 오전 10시 ~ 밤 9시
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          {pending ? (
            <button type="button" className={styles.more} disabled>
              AI가 답을 쓰는 중…
            </button>
          ) : done < TURNS.length ? (
            <button type="button" className={styles.more} onClick={() => ask(done + 1)}>
              다음 요청 보기 ({done}/{TURNS.length})
            </button>
          ) : (
            <button
              type="button"
              className={styles.again}
              onClick={() => {
                setShown(0);
                ask(1);
              }}
            >
              처음부터 다시 보기
            </button>
          )}
        </div>
      </div>
      <p>
        이렇게 말로 주고받을 수 있는 건 생성형 AI가{" "}
        <strong>우리가 쓴 글을 읽고, 그에 맞는 글을 새로 만들 수 있기 때문</strong>이에요. 그 글이
        대답이 되기도 하고, 페이지를 만드는 코드가 되기도 해요.
      </p>
    </div>
  );
}

/** A small robot face for the AI side of the chat. */
function RobotFace() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="2.5" r="1.4" fill="currentColor" />
      <rect x="4.5" y="6" width="15" height="12.5" rx="3.5" fill="currentColor" />
      <rect x="2.5" y="10.5" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="19.5" y="10.5" width="2" height="4" rx="1" fill="currentColor" />
      <circle cx="9.3" cy="11.6" r="1.6" fill="#2b2925" />
      <circle cx="14.7" cy="11.6" r="1.6" fill="#2b2925" />
      <path d="M9.5 15.3h5" stroke="#2b2925" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
