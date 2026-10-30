"use client";

// Client component: the scene plays on a clock (autoplay with pause/replay/skip),
// and reduced-motion users get the final composed frame immediately.
import Image from "next/image";
import { useCallback, useEffect, useState, type Ref } from "react";
import { REEL_KEY_HINT, REEL_KEYSHORTCUTS, useReelKeyboard } from "./useReelKeyboard";
import styles from "./WebPossibilitiesReel.module.scss";

const TICK = 50;
/** Each example shows its subtitle alone for this long before the motion starts. */
const LEAD = 1200;
const END = 45000 + LEAD * 4;
export const WEB_REEL_END_SECONDS = END / 1000;
/** Playback speed over the cue timeline (49.8s of cues → about 28s). */
const SPEED = 1.8;

/**
 * Cue times (ms) for the "how far can a website go" scene. Each example starts with its
 * subtitle alone; its motion cues come one LEAD later.
 */
const CUE = {
  title: 200,
  one: 1200,
  typeStart: 1600 + LEAD,
  typeEnd: 2800 + LEAD,
  blocks: [3000, 3400, 3700, 4300, 4600, 4900, 5200, 5600].map((ms) => ms + LEAD),
  layerOne: 7200 + LEAD,
  // 02 나만의 서비스 — a small tool: enter numbers, get the answer
  two: 9800 + LEAD,
  tool: 10200 + LEAD * 2,
  amountStart: 10600 + LEAD * 2,
  amountEnd: 11300 + LEAD * 2,
  people: 11500 + LEAD * 2,
  toolCursorIn: 11800 + LEAD * 2,
  toolCursorToButton: 12100 + LEAD * 2,
  toolClick: 13200 + LEAD * 2,
  result: 13500 + LEAD * 2,
  shares: [13900, 14100, 14300, 14500].map((ms) => ms + LEAD * 2),
  layerTwo: 15800 + LEAD * 2,
  // 03 플랫폼 — many people post and browse; a new post joins the board
  three: 18800 + LEAD * 2,
  board: [19200, 19600, 20000, 20300, 20600].map((ms) => ms + LEAD * 3),
  boardCursorIn: 21200 + LEAD * 3,
  boardCursorToUpload: 21700 + LEAD * 3,
  uploadClick: 22900 + LEAD * 3,
  newPost: 23200 + LEAD * 3,
  boardCount: 23400 + LEAD * 3,
  layerThree: 25400 + LEAD * 3,
  // 04 판매와 결제 — the real class sign-up flow: apply, check, notify
  four: 27800 + LEAD * 3,
  form: [28100, 28400, 28700].map((ms) => ms + LEAD * 4),
  cursorToButton: 29400 + LEAD * 4,
  clickButton: 30500 + LEAD * 4,
  duplicate: 30800 + LEAD * 4,
  capacity: 31200 + LEAD * 4,
  dot: 31300 + LEAD * 4,
  row: 32100 + LEAD * 4,
  counter: 32300 + LEAD * 4,
  mail: 32900 + LEAD * 4,
  manual: [35000, 35300, 35600, 35900, 36200].map((ms) => ms + LEAD * 4),
  fold: 37700 + LEAD * 4,
  layerFour: 38700 + LEAD * 4,
  reveal: 40200 + LEAD * 4,
  frame: 40700 + LEAD * 4,
  chips: 41400 + LEAD * 4,
  finale: 42200 + LEAD * 4,
  finaleLine: 43000 + LEAD * 4,
};

const EXAMPLES = [
  {
    phase: "one",
    n: "01",
    title: "포트폴리오",
    layer: "화면",
    line: "나를 보여주는 포트폴리오를 만들어 볼 수도 있고,",
    ours: true,
  },
  {
    phase: "two",
    n: "02",
    title: "나만의 서비스",
    layer: "동작",
    line: "상상만 해봤던 나만의 서비스를 만들어볼 수도 있고,",
    ours: false,
  },
  {
    phase: "three",
    n: "03",
    title: "플랫폼",
    layer: "데이터",
    line: "여러 사람들이 즐기고 활동하는 플랫폼을 만들어볼 수도 있어요.",
    ours: false,
  },
  {
    phase: "four",
    n: "04",
    title: "판매와 결제",
    layer: "운영",
    line: "그리고 판매, 결제 시스템 등을 만들어 사업의 운영까지 웹에 맡겨볼 수도 있어요.",
    ours: false,
  },
] as const;

const ADDRESS = "softwood.studio";

const WORKS = [
  { position: "18% 50%", caption: "스케치에서 시작해요" },
  { position: "62% 40%", caption: "느티나무 의자 01" },
  { position: "88% 55%", caption: "작업 기록 사진" },
];

const POSTS = [
  {
    src: "/images/workbook/notes/describe-the-result-v1.png",
    author: "들판",
    title: "원하는 결과를 먼저 그려보기",
  },
  {
    src: "/images/workbook/notes/check-the-source-v1.png",
    author: "바다",
    title: "출처를 한 번 더 확인하는 이유",
  },
  {
    src: "/images/workbook/notes/leave-a-handoff-v1.png",
    author: "하늘",
    title: "다음의 나에게 메모 남기기",
  },
];
const NEW_POST = {
  src: "/images/workbook/notes/show-the-screen-v1.png",
  author: "모쏘",
  title: "화면을 보여주며 부탁하기",
};

/** 02 나만의 서비스: 모임 회비 나누기. */
const AMOUNT = "120,000";
const MEMBERS = ["모쏘", "들판", "바다", "하늘"];

const MANUAL = [
  "DM으로 온 신청 확인",
  "표에 이름·연락처 옮겨 적기",
  "이미 신청한 사람인지, 자리가 남았는지 확인",
  "입금 안내 답장 쓰기",
  "기한 지난 신청 정리",
];

type Phase = "one" | "two" | "three" | "four" | "finale";

function phaseAt(t: number): Phase {
  if (t >= CUE.reveal) return "finale";
  if (t >= CUE.four) return "four";
  if (t >= CUE.three) return "three";
  if (t >= CUE.two) return "two";
  return "one";
}

export function WebPossibilitiesReel({
  startAt = 0,
  paused = false,
  hold = false,
  browserRef,
  inStage = false,
  onPrev,
  onNext,
}: {
  /** Seconds to start from (scene 2 reopens at its end when coming back). */
  startAt?: number;
  paused?: boolean;
  /** Keeps the clock at its start while page 1 hands off to this scene. */
  hold?: boolean;
  /** The browser window, measured by page 1 to land its growing window exactly. */
  browserRef?: Ref<HTMLDivElement>;
  /** Rendered inside the class intro card instead of as a full page. */
  inStage?: boolean;
  /** ← before the first example / → after the last one move to the neighbouring intro scene. */
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [t, setT] = useState(() => Math.min(END, Math.max(0, startAt * 1000)));
  const [playing, setPlaying] = useState(!paused);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduced(query.matches);
      if (query.matches) {
        setT(END);
        setPlaying(false);
      }
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!playing || hold) return;
    // Advance by real elapsed time so throttled timers don't slow the scene down.
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - last) * SPEED;
      last = now;
      setT((prev) => {
        const next = prev + delta;
        if (next >= END) {
          setPlaying(false);
          return END;
        }
        return next;
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [playing, hold]);

  const replay = useCallback(() => {
    setT(0);
    setPlaying(!reduced);
  }, [reduced]);
  const skip = useCallback(() => {
    setT(END);
    setPlaying(false);
  }, []);
  const toggle = useCallback(() => {
    if (t >= END) replay();
    else setPlaying((p) => !p);
  }, [t, replay]);

  useReelKeyboard({
    t,
    end: END,
    steps: [0, CUE.two, CUE.three, CUE.four, CUE.reveal],
    rate: SPEED,
    disabled: hold,
    still: reduced,
    onPrev,
    onNext,
    toggle,
    seek: (ms) => {
      // Stepping back from the finished frame plays again; otherwise the play state stays as is.
      if (t >= END && ms < END) setPlaying(true);
      setT(ms);
    },
  });

  const at = (ms: number) => t >= ms;
  const show = (ms: number) => (at(ms) ? styles.in : styles.out);
  const phase = phaseAt(t);
  const typed = ADDRESS.slice(
    0,
    Math.max(
      0,
      Math.min(
        ADDRESS.length,
        Math.floor(((t - CUE.typeStart) / (CUE.typeEnd - CUE.typeStart)) * ADDRESS.length),
      ),
    ),
  );
  const amount = AMOUNT.slice(
    0,
    Math.max(
      0,
      Math.min(
        AMOUNT.length,
        Math.ceil(((t - CUE.amountStart) / (CUE.amountEnd - CUE.amountStart)) * AMOUNT.length),
      ),
    ),
  );
  const address =
    phase === "one"
      ? typed
      : phase === "two"
        ? "split.tools/dutch"
        : phase === "three"
          ? "makers.board"
          : "weekend-class.kr/apply";
  const finished = t >= END;

  let cursor = { x: 50, y: 96, visible: false, click: false };
  if (phase === "two" && at(CUE.toolCursorIn)) {
    const moved = at(CUE.toolCursorToButton);
    cursor = {
      x: moved ? 24 : 50,
      y: moved ? 74 : 96,
      visible: !at(CUE.result + 500),
      click: at(CUE.toolClick) && !at(CUE.toolClick + 400),
    };
  }
  if (phase === "three" && at(CUE.boardCursorIn)) {
    const moved = at(CUE.boardCursorToUpload);
    cursor = {
      x: moved ? 88 : 60,
      y: moved ? 9 : 40,
      visible: !at(CUE.newPost + 500),
      click: at(CUE.uploadClick) && !at(CUE.uploadClick + 400),
    };
  }
  if (phase === "four" && at(CUE.four + 600)) {
    const moved = at(CUE.cursorToButton);
    cursor = {
      x: moved ? 18 : 40,
      y: moved ? 84 : 98,
      visible: !at(CUE.dot + 400),
      click: at(CUE.clickButton) && !at(CUE.clickButton + 400),
    };
  }

  return (
    <section
      className={`paper ${styles.reel} ${inStage ? styles.inStage : ""}`}
      aria-labelledby="web-reel-title"
      aria-keyshortcuts={REEL_KEYSHORTCUTS}
    >
      <div className={styles.captions}>
        <span className={styles.eyebrow}>HOW FAR CAN THE WEB GO</span>
        <h1 id="web-reel-title" className={show(CUE.title)}>
          웹사이트로,
          <br />
          <span>어디까지 만들 수 있을까요?</span>
        </h1>
        <ol className={styles.steps}>
          {EXAMPLES.map((example) => (
            <li
              key={example.phase}
              className={`${phase === example.phase ? styles.active : ""} ${at(CUE[example.phase]) ? styles.seen : ""}`}
              aria-current={phase === example.phase ? "step" : undefined}
            >
              <span className={styles.num}>{example.n}</span>
              <b>{example.title}</b>
              <em>{example.layer}</em>
              {/* 네 예시 중 이 클래스에서 직접 만드는 것은 01뿐이다. */}
              {example.ours && <span className={styles.ours}>이 클래스</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.stageColumn}>
        <div
          className={styles.viewport}
          role="img"
          aria-label="하나의 브라우저 창이 공방 소개 페이지, 회비 나누기 도구, 여러 사람이 작업을 올리는 게시판, 클래스 신청과 입금 확인 자동화 예시로 차례로 바뀌고, 마지막에 그 창이 이 강의 화면 안에 있었음을 보여주는 장면"
        >
          <div className={`${styles.workbookFrame} ${show(CUE.frame)}`}>
            <div className={styles.frameBar}>
              <span>WEB CLASS · 클래스 인트로</span>
              <span>지금 이 화면</span>
            </div>
            <div className={styles.frameCaptions}>
              <i />
              <i />
              <i className={styles.short} />
              <i />
              <i className={styles.short} />
            </div>
          </div>

          <div
            ref={browserRef}
            className={`${styles.browser} ${at(CUE.reveal) ? styles.shrunk : ""}`}
          >
            <div className={styles.chrome}>
              <span className={styles.dots}>
                <i />
                <i />
                <i />
              </span>
              <span className={styles.address}>
                {address}
                {phase === "one" && !at(CUE.typeEnd + 400) && <span className={styles.caret} />}
              </span>
            </div>

            <div className={styles.body}>
              {/* Scene 1 — a maker's one-page introduction */}
              <div
                className={`${styles.scene} ${styles.site} ${phase === "one" ? styles.in : styles.out} ${at(CUE.layerOne) ? styles.layered : ""}`}
              >
                <header className={`${styles.block} ${styles.siteNav} ${show(CUE.blocks[0])}`}>
                  <b>SOFTWOOD STUDIO</b>
                  <span>작업 · 소개 · 문의</span>
                </header>
                <div className={`${styles.block} ${styles.siteHero}`}>
                  <div className={`${styles.heroText} ${show(CUE.blocks[1])}`}>
                    <small>FURNITURE MAKER</small>
                    <strong>
                      손으로 다듬은,
                      <br />
                      오래 쓰는 의자.
                    </strong>
                    <p>작은 공방에서 의자와 테이블을 만듭니다.</p>
                    <span className={styles.siteButton}>작업 보기</span>
                  </div>
                  <div className={`${styles.heroImage} ${show(CUE.blocks[2])}`}>
                    <Image
                      src="/images/workbook/candidates/portfolio-editorial-v1.png"
                      alt=""
                      loading="eager"
                      fill
                      sizes="(min-width: 1024px) 30vw, 45vw"
                    />
                  </div>
                </div>
                <div className={`${styles.block} ${styles.works}`}>
                  <small className={show(CUE.blocks[3])}>최근 작업</small>
                  <div>
                    {WORKS.map((work, i) => (
                      <figure key={work.caption} className={show(CUE.blocks[4 + i])}>
                        <span>
                          <Image
                            src="/images/workbook/candidates/portfolio-editorial-v1.png"
                            alt=""
                            loading="eager"
                            fill
                            sizes="15vw"
                            style={{ objectPosition: work.position }}
                          />
                        </span>
                        <figcaption>{work.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
                <div className={`${styles.block} ${styles.siteFooter} ${show(CUE.blocks[7])}`}>
                  <span>주문 제작 문의</span>
                  <b>hello@softwood.studio →</b>
                </div>
                <span className={`${styles.layerTag} ${show(CUE.layerOne)}`}>화면</span>
              </div>

              {/* Scene 2 — a small tool of my own: split a group fee */}
              <div
                className={`${styles.scene} ${styles.tool} ${phase === "two" ? styles.in : styles.out}`}
              >
                <div className={`${styles.toolForm} ${show(CUE.tool)}`}>
                  <header>
                    <b>모임 회비 나누기</b>
                    <span>나만 쓰려고 만든 작은 도구</span>
                  </header>
                  <label>
                    <span>총 금액</span>
                    <span className={styles.toolField}>
                      {amount}
                      {at(CUE.amountStart) && <em>원</em>}
                    </span>
                  </label>
                  <label className={show(CUE.people)}>
                    <span>인원</span>
                    <span className={styles.toolField}>
                      {MEMBERS.length}
                      <em>명</em>
                    </span>
                  </label>
                  <span
                    className={`${styles.toolButton} ${show(CUE.people)} ${at(CUE.toolClick) && !at(CUE.toolClick + 400) ? styles.pressed : ""}`}
                  >
                    나누기
                  </span>
                </div>
                <div className={`${styles.toolResult} ${show(CUE.result)}`}>
                  <small>한 사람에</small>
                  <strong>30,000원</strong>
                  <ul>
                    {MEMBERS.map((member, i) => (
                      <li key={member} className={show(CUE.shares[i])}>
                        <i aria-hidden>{member[0]}</i>
                        {member}
                        <b>30,000원</b>
                      </li>
                    ))}
                  </ul>
                </div>
                <span className={`${styles.layerTag} ${show(CUE.layerTwo)}`}>동작</span>
              </div>

              {/* Scene 3 — a platform: many people post; a new post joins the board */}
              <div
                className={`${styles.scene} ${styles.blog} ${phase === "three" ? styles.in : styles.out}`}
              >
                <header className={`${styles.blogNav} ${show(CUE.board[0])}`}>
                  <b>makers board</b>
                  <span>
                    작업 {at(CUE.boardCount) ? 129 : 128}개 · 멤버 36명
                    <span
                      className={`${styles.uploadButton} ${at(CUE.uploadClick) && !at(CUE.uploadClick + 400) ? styles.pressed : ""}`}
                    >
                      + 올리기
                    </span>
                  </span>
                </header>
                <div className={styles.boardGrid}>
                  {/* 올린 글이 맨 앞에 들어오며 나머지가 한 칸씩 밀린다. */}
                  {at(CUE.newPost) && (
                    <article className={`${styles.post} ${styles.newPost}`}>
                      <span className={styles.thumb}>
                        <Image src={NEW_POST.src} alt="" loading="eager" fill sizes="15vw" />
                      </span>
                      <small>
                        <i aria-hidden>{NEW_POST.author[0]}</i>
                        {NEW_POST.author} · 방금
                      </small>
                      <b>{NEW_POST.title}</b>
                    </article>
                  )}
                  {POSTS.map((post, i) => (
                    <article
                      key={post.title}
                      className={`${styles.post} ${show(CUE.board[1 + i])}`}
                    >
                      <span className={styles.thumb}>
                        <Image src={post.src} alt="" loading="eager" fill sizes="15vw" />
                      </span>
                      <small>
                        <i aria-hidden>{post.author[0]}</i>
                        {post.author}
                      </small>
                      <b>{post.title}</b>
                    </article>
                  ))}
                </div>
                <span className={`${styles.layerTag} ${show(CUE.layerThree)}`}>데이터</span>
              </div>

              {/* Scene 4 — sales & payments: the real class sign-up flow, shown in miniature */}
              <div
                className={`${styles.scene} ${styles.ops} ${phase === "four" || phase === "finale" ? styles.in : styles.out}`}
              >
                <div className={styles.apply}>
                  <span className={`${styles.applyCover} ${show(CUE.form[0])}`}>
                    <Image
                      src="/images/workbook/candidates/service-editorial-v1.png"
                      alt=""
                      loading="eager"
                      fill
                      sizes="20vw"
                    />
                  </span>
                  <div className={show(CUE.form[1])}>
                    <small>주말 원데이 클래스</small>
                    <strong>나만의 첫 홈페이지</strong>
                  </div>
                  <div className={`${styles.fields} ${show(CUE.form[2])}`}>
                    <span>모쏘</span>
                    <span>example@mail.com</span>
                  </div>
                  <span
                    className={`${styles.submit} ${show(CUE.form[2])} ${at(CUE.clickButton) && !at(CUE.clickButton + 400) ? styles.pressed : ""}`}
                  >
                    신청하기
                  </span>
                </div>

                <div className={styles.pipe}>
                  <span className={show(CUE.duplicate)}>✓ 중복 신청 아님</span>
                  <span className={show(CUE.capacity)}>✓ 정원 남음</span>
                </div>

                <div className={styles.admin}>
                  <aside className={styles.adminSide}>
                    <b>운영 관리</b>
                    <span className={styles.current}>신청 관리</span>
                    <span>클래스</span>
                    <span>메일 기록</span>
                  </aside>
                  <div className={styles.adminMain}>
                    <div className={styles.stats}>
                      <div>
                        <small>전체 신청</small>
                        <b>{at(CUE.counter) ? 8 : 7}</b>
                      </div>
                      <div>
                        <small>입금 대기</small>
                        <b>{at(CUE.counter) ? 3 : 2}</b>
                      </div>
                      <div>
                        <small>결제 완료</small>
                        <b>5</b>
                      </div>
                      <div>
                        <small>남은 자리</small>
                        <b>{at(CUE.counter) ? 4 : 5}</b>
                      </div>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>이름</th>
                          <th>신청일</th>
                          <th>상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={at(CUE.row) ? styles.newRow : styles.hiddenRow}>
                          <td>모쏘</td>
                          <td>10.29</td>
                          <td>
                            <em className={styles.wait}>입금 대기</em>
                          </td>
                        </tr>
                        <tr>
                          <td>들판</td>
                          <td>10.28</td>
                          <td>
                            <em>결제 완료</em>
                          </td>
                        </tr>
                        <tr>
                          <td>바다</td>
                          <td>10.28</td>
                          <td>
                            <em className={styles.wait}>입금 대기</em>
                          </td>
                        </tr>
                        <tr>
                          <td>하늘</td>
                          <td>10.27</td>
                          <td>
                            <em>결제 완료</em>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={`${styles.toast} ${show(CUE.mail)}`}>
                    <b>✉ 메일 발송</b>
                    모쏘 님에게 신청·입금 안내를 보냈어요
                  </div>
                </div>

                <span
                  className={`${styles.dot} ${at(CUE.dot) ? styles.travel : ""} ${at(CUE.row) ? styles.out : ""}`}
                />

                <div
                  className={`${styles.manual} ${at(CUE.manual[0]) && !at(CUE.reveal) ? styles.in : styles.out}`}
                >
                  <small>손으로 하면</small>
                  <ol className={at(CUE.fold) ? styles.folded : ""}>
                    {MANUAL.map((step, i) => (
                      <li key={step} className={show(CUE.manual[i])}>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className={show(CUE.fold)}>
                    → 신청 한 번에 <b>자동으로</b>
                  </p>
                </div>
                <span
                  className={`${styles.layerTag} ${at(CUE.layerFour) && !at(CUE.reveal) ? styles.in : styles.out}`}
                >
                  운영
                </span>
              </div>

              <span
                aria-hidden
                className={`${styles.cursor} ${cursor.visible ? styles.in : styles.out} ${cursor.click ? styles.clicking : ""}`}
                style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
              />
            </div>
          </div>

          <div className={`${styles.chips} ${show(CUE.chips)}`}>
            <span>화면</span>
            <span>동작</span>
            <span>데이터</span>
            <span>운영</span>
          </div>
        </div>
        {/* Video-style player bar attached to the scene. */}
        <div className={styles.player}>
          <button
            type="button"
            onClick={toggle}
            aria-label={finished ? "다시 보기" : playing ? "일시정지" : "재생"}
            title={finished ? "다시 보기" : playing ? "일시정지" : "재생"}
          >
            <PlayerIcon kind={finished ? "replay" : playing ? "pause" : "play"} />
          </button>
          <div
            className={styles.progress}
            title={REEL_KEY_HINT}
            role="progressbar"
            aria-label="장면 진행"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((t / END) * 100)}
          >
            <span style={{ width: `${(t / END) * 100}%` }} />
          </div>
          <button
            type="button"
            onClick={skip}
            disabled={finished}
            aria-label="건너뛰기"
            title="건너뛰기"
          >
            <PlayerIcon kind="skip" />
          </button>
        </div>
        {/* The message sits right under the scene and its player bar. */}
        <div className={styles.subtitle} aria-live="polite">
          {phase === "finale" ? (
            <div key="finale" className={styles.subtitleText}>
              <strong>그 첫걸음을, 처음부터 함께 만들어봐요.</strong>
              <p className={show(CUE.finaleLine)}>
                나를 보여주는 포트폴리오 한 페이지에서 시작해요. 여기서 익힌 화면과 데이터 다루는
                경험은 앱이나 게임을 만들 때도 도움이 될 거예요.
              </p>
            </div>
          ) : (
            at(CUE.one) && (
              <p key={phase} className={styles.subtitleText}>
                {EXAMPLES.find((example) => example.phase === phase)?.line}
              </p>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export function PlayerIcon({ kind }: { kind: "play" | "pause" | "replay" | "skip" }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false">
      {kind === "play" && <path d="M4 2.5v11l9-5.5z" fill="currentColor" />}
      {kind === "pause" && <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />}
      {kind === "skip" && <path d="M2.5 2.5v11l7.5-5.5zM10.5 2.5h3v11h-3z" fill="currentColor" />}
      {kind === "replay" && (
        <path
          d="M8 3a5 5 0 1 1-4.6 3H1.8L4.2 3.2 6.6 6H5.1A3.4 3.4 0 1 0 8 4.6z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}
