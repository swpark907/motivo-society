"use client";

// Client component: the scene plays on a clock (autoplay with pause/replay/skip),
// and reduced-motion users get the final composed frame immediately.
import Image from "next/image";
import { useCallback, useEffect, useState, type Ref } from "react";
import styles from "./WebPossibilitiesReel.module.scss";

const TICK = 50;
/** Each example shows its subtitle alone for this long before the motion starts. */
const LEAD = 1200;
const END = 36000 + LEAD * 3;
export const WEB_REEL_END_SECONDS = END / 1000;
/** Playback speed over the cue timeline (39.6s of cues → about 23s). */
const SPEED = 1.7;

/** Cue times (ms) for the 1-1-1 "how far can a website go" scene. */
const CUE = {
  title: 200,
  one: 1200,
  typeStart: 1600 + LEAD,
  typeEnd: 2800 + LEAD,
  blocks: [3000, 3400, 3700, 4300, 4600, 4900, 5200, 5600].map((ms) => ms + LEAD),
  layerOne: 7200 + LEAD,
  two: 9800 + LEAD,
  blog: [10200, 10600, 11000, 11300, 11600].map((ms) => ms + LEAD * 2),
  cursorIn: 12200 + LEAD * 2,
  cursorToCard: 12700 + LEAD * 2,
  clickCard: 13900 + LEAD * 2,
  detail: 14200 + LEAD * 2,
  layerTwo: 16400 + LEAD * 2,
  three: 18800 + LEAD * 2,
  form: [19100, 19400, 19700].map((ms) => ms + LEAD * 3),
  cursorToButton: 20400 + LEAD * 3,
  clickButton: 21500 + LEAD * 3,
  duplicate: 21800 + LEAD * 3,
  capacity: 22200 + LEAD * 3,
  dot: 22300 + LEAD * 3,
  row: 23100 + LEAD * 3,
  counter: 23300 + LEAD * 3,
  mail: 23900 + LEAD * 3,
  manual: [26000, 26300, 26600, 26900, 27200].map((ms) => ms + LEAD * 3),
  fold: 28700 + LEAD * 3,
  layerThree: 29700 + LEAD * 3,
  reveal: 31200 + LEAD * 3,
  frame: 31700 + LEAD * 3,
  chips: 32400 + LEAD * 3,
  finale: 33200 + LEAD * 3,
  finaleLine: 34000 + LEAD * 3,
};

const EXAMPLES = [
  {
    phase: "one",
    n: "01",
    title: "소개 페이지",
    layer: "화면",
    line: (
      <>
        나를, 내 일을 한 화면에 보여줘요. <b>이 클래스에서 직접 만들 거예요.</b>
      </>
    ),
  },
  {
    phase: "two",
    n: "02",
    title: "블로그",
    layer: "동작",
    line: "글이 쌓이고, 골라 읽고, 둘러볼 수 있어요.",
  },
  {
    phase: "three",
    n: "03",
    title: "운영 자동화",
    layer: "데이터",
    line: "신청이 들어오면 정리하고, 확인하고, 안내까지. 손으로 하던 일을 웹에 맡길 수 있어요.",
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
    tag: "기록",
    title: "원하는 결과를 먼저 그려보기",
  },
  {
    src: "/images/workbook/notes/check-the-source-v1.png",
    tag: "습관",
    title: "출처를 한 번 더 확인하는 이유",
  },
  {
    src: "/images/workbook/notes/leave-a-handoff-v1.png",
    tag: "회고",
    title: "다음의 나에게 메모 남기기",
  },
];

const MANUAL = [
  "DM으로 온 신청 확인",
  "표에 이름·연락처 옮겨 적기",
  "이미 신청한 사람인지, 자리가 남았는지 확인",
  "입금 안내 답장 쓰기",
  "기한 지난 신청 정리",
];

type Phase = "one" | "two" | "three" | "finale";

function phaseAt(t: number): Phase {
  if (t >= CUE.reveal) return "finale";
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
  const address =
    phase === "one"
      ? typed
      : phase === "two"
        ? at(CUE.detail)
          ? "dailynote.blog/posts/draw-the-result"
          : "dailynote.blog"
        : "weekend-class.kr/apply";
  const finished = t >= END;

  let cursor = { x: 50, y: 96, visible: false, click: false };
  if (phase === "two" && at(CUE.cursorIn)) {
    const moved = at(CUE.cursorToCard) && !at(CUE.detail);
    cursor = {
      x: moved ? 24 : 50,
      y: moved ? 78 : 96,
      visible: !at(CUE.detail + 500),
      click: at(CUE.clickCard) && !at(CUE.clickCard + 400),
    };
  }
  if (phase === "three" && at(CUE.three + 600)) {
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
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.stageColumn}>
        <div
          className={styles.viewport}
          role="img"
          aria-label="하나의 브라우저 창이 공방 소개 페이지, 블로그, 클래스 신청 자동화 예시로 차례로 바뀌고, 마지막에 그 창이 이 강의 화면 안에 있었음을 보여주는 장면"
        >
          <div className={`${styles.workbookFrame} ${show(CUE.frame)}`}>
            <div className={styles.frameBar}>
              <span>1-1-1 · 강의 인트로</span>
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

              {/* Scene 2 — blog home → post detail */}
              <div
                className={`${styles.scene} ${styles.blog} ${phase === "two" ? styles.in : styles.out}`}
              >
                <header className={`${styles.blogNav} ${show(CUE.blog[0])}`}>
                  <b>daily note</b>
                  <span>전체 · 기록 · 습관 · 회고</span>
                </header>
                <div className={`${styles.blogHome} ${at(CUE.detail) ? styles.dimmed : ""}`}>
                  <article className={`${styles.featured} ${show(CUE.blog[1])}`}>
                    <span className={styles.thumb}>
                      <Image
                        src="/images/workbook/notes/show-the-screen-v1.png"
                        alt=""
                        loading="eager"
                        fill
                        sizes="30vw"
                      />
                    </span>
                    <div>
                      <small>추천 글 · 기록</small>
                      <strong>화면을 보여주며 부탁하면 달라지는 것</strong>
                      <p>말로만 설명하던 걸 화면 한 장으로 보여줬더니, 대화가 짧아졌어요.</p>
                      <time>10월 28일 · 4분</time>
                    </div>
                  </article>
                  <div className={styles.postGrid}>
                    {POSTS.map((post, i) => (
                      <article
                        key={post.title}
                        className={`${styles.post} ${show(CUE.blog[2 + i])} ${i === 0 && at(CUE.clickCard) ? styles.pressed : ""}`}
                      >
                        <span className={styles.thumb}>
                          <Image src={post.src} alt="" loading="eager" fill sizes="15vw" />
                        </span>
                        <small>{post.tag}</small>
                        <b>{post.title}</b>
                      </article>
                    ))}
                  </div>
                </div>
                <article className={`${styles.detail} ${at(CUE.detail) ? styles.open : ""}`}>
                  <span className={styles.detailCover}>
                    <Image src={POSTS[0].src} alt="" loading="eager" fill sizes="40vw" />
                  </span>
                  <div>
                    <small>기록 · 10월 26일</small>
                    <strong>{POSTS[0].title}</strong>
                    <p>
                      무엇을 만들고 싶은지보다, 다 만들어졌을 때 어떤 모습이면 좋을지를 먼저
                      적어봤어요.
                    </p>
                    <p>
                      종이에 대충 그린 화면 한 장이 긴 설명보다 많은 걸 전해줬어요. 그 뒤로는
                      시작하기 전에 결과를 먼저 그려보는 습관이 생겼어요.
                    </p>
                  </div>
                </article>
                <span className={`${styles.layerTag} ${show(CUE.layerTwo)}`}>동작</span>
              </div>

              {/* Scene 3 — class sign-up automation (mirrors the real class sign-up flow) */}
              <div
                className={`${styles.scene} ${styles.ops} ${phase === "three" || phase === "finale" ? styles.in : styles.out}`}
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
                  className={`${styles.layerTag} ${at(CUE.layerThree) && !at(CUE.reveal) ? styles.in : styles.out}`}
                >
                  데이터
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
          </div>
        </div>
        {/* The message sits where the eye already is: right under the moving scene. */}
        <div className={styles.subtitle} aria-live="polite">
          {phase === "finale" ? (
            <div key="finale" className={styles.subtitleText}>
              <strong>이런 것들을 만들어볼 수 있어요.</strong>
              <p className={show(CUE.finaleLine)}>
                화면을 만들고, 반응을 더하고, 데이터를 다루는 경험은 앱, 게임을 만들 때도 유용하게
                쓰일 겁니다.
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
        <p className={styles.notice}>
          예시 화면이에요. 사진은 연출용 생성 이미지이고, 신청은 실제로 전송되지 않아요.
        </p>
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={toggle}>
          {finished ? "다시 보기" : playing ? "일시정지" : "재생"}
        </button>
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="장면 진행"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((t / END) * 100)}
        >
          <span style={{ width: `${(t / END) * 100}%` }} />
        </div>
        {!finished && (
          <button type="button" onClick={skip}>
            건너뛰기
          </button>
        )}
      </div>
    </section>
  );
}
