"use client";

// Client component: the scene plays on a clock (autoplay with pause/replay/skip, jump by unit),
// measures each frame to scale its page, and reduced-motion users get the final row immediately.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { workbookCourse } from "@/lib/workbook-course";
import { workbookLearningExample } from "@/lib/workbook-learning-example";
import { PlayerIcon } from "./WebPossibilitiesReel";
import { REEL_KEY_HINT, REEL_KEYSHORTCUTS, useReelKeyboard } from "./useReelKeyboard";
import reel from "./WebPossibilitiesReel.module.scss";
import styles from "./JourneyGrowthReel.module.scss";

const TICK = 50;

/**
 * The 1-1-1 "journey ahead" scene: five frames in a row, one per unit.
 * The current unit's frame opens wide and plays; finished units stay as thumbnails.
 */
const STARTS = [300, 3700, 7100, 10500, 13900];
const FINALE = 17500;
const END = 18600;
export const JOURNEY_REEL_END_SECONDS = END / 1000;

/** Cue times (ms) inside each unit, counted from that unit's start. */
const L = {
  // 01 AI 도구 준비하기 — a request, a first file, a first plain screen
  request: 700,
  file: 1300,
  title: 1900,
  // 02 기획하고 첫 화면 만들기 — a short plan folds into a request and the draft fills in
  plan: 600,
  fold: 1300,
  draft: [1600, 1850, 2050, 2250],
  // 03 반응형 화면 만들기 — the phone joins, a clipped row is fixed
  phone: 500,
  clipped: 1000,
  fixed: 2100,
  // 04 기능과 데이터 저장 — pick an item to see it in detail
  cursorIn: 500,
  toCard: 700,
  click: 1500,
  detail: 1700,
  // 05 배포하고 고치기 — a web address, the same page elsewhere, a fix uploaded again
  typeStart: 500,
  typeEnd: 1200,
  phoneAddress: 1400,
  edit: 1800,
  badge: 2300,
};

/** What the page gains in each unit. */
const GAINS = ["첫 파일", "첫 화면", "PC·모바일", "클릭 동작", "배포 주소"];

const LINES = [
  "먼저 AI가 무엇인지 알아보고, 도구를 준비해 코드를 작성해봅니다.",
  "어떤 페이지를 만들지 정하고, AI에게 부탁해 화면을 완성해봅니다.",
  "컴퓨터와 휴대폰 화면을 오가며, 화면 크기에 맞게 배치해봐요.",
  "사용자의 클릭에 동작하게 만들고, 데이터를 저장하는 원리에 대해 알아봅니다.",
  "배포해서 나만의 주소를 만들고, 나의 사이트를 관리하는 법을 알아봐요.",
];

const { title: PAGE_TITLE, intro: PAGE_INTRO, notes: NOTES } = workbookLearningExample;
const PLACES = workbookLearningExample.content.split("\n").map((line) => {
  const [name, note] = line.split(" · ");
  return { name, note };
});
const EDITED_INTRO = "자리와 소음을 기준으로 세 장소를 비교해요.";
const FILE_ADDRESS = "file:///내 작업 폴더/index.html";
const WEB_ADDRESS = "reading-spots.site";

/** The page is drawn at this size and scaled to fit each frame. */
const CANVAS_WIDTH = 800;
const CANVAS_RATIO = 1.6;
/** The open frame never takes more than this share of the row, so finished units stay readable. */
const ACTIVE_MAX_SHARE = 0.62;
const MIN_STRIP = 200;

type Fit = { strip: number; active: number };

/**
 * Sizes the strip to the height actually left in the lesson card (no estimate, so no stray scroll),
 * and the open frame's width from that height so its picture keeps the page ratio.
 */
function useStripFit() {
  const section = useRef<HTMLElement>(null);
  const strip = useRef<HTMLOListElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useLayoutEffect(() => {
    const root = section.current;
    const row = strip.current;
    if (!root || !row) return;
    let scroller = root.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) {
      scroller = scroller.parentElement;
    }
    // Outside the lesson card (standalone preview) the CSS estimate stays in charge.
    if (!scroller) return;
    const box = scroller;
    const wide = window.matchMedia("(min-width: 768px)");

    const measure = () => {
      if (!wide.matches) {
        setFit(null);
        return;
      }
      let padding = 0;
      for (let node = root.parentElement; node && node !== box; node = node.parentElement) {
        const style = getComputedStyle(node);
        padding += parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      }
      const others = root.offsetHeight - row.offsetHeight;
      const height = Math.max(MIN_STRIP, Math.floor(box.clientHeight - padding - others) - 1);
      const head = row.querySelector("button")?.offsetHeight ?? 40;
      const gap = parseFloat(getComputedStyle(row.firstElementChild ?? row).rowGap) || 8;
      const active = Math.floor(
        Math.min((height - head - gap) * CANVAS_RATIO, row.clientWidth * ACTIVE_MAX_SHARE),
      );
      setFit((prev) =>
        prev && prev.strip === height && prev.active === active ? prev : { strip: height, active },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(row);
    wide.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", measure);
    };
  }, []);

  const style = fit
    ? ({ "--strip-h": `${fit.strip}px`, "--active-w": `${fit.active}px` } as CSSProperties)
    : undefined;
  return { section, strip, style };
}

export function JourneyGrowthReel({
  startAt = 0,
  paused = false,
  onPrev,
  onNext,
}: {
  /** Seconds to start from (the scene reopens at its end when coming back). */
  startAt?: number;
  paused?: boolean;
  /** ← before the first unit / → after the finale move to the neighbouring intro scene. */
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
    if (!playing) return;
    // Advance by real elapsed time so throttled timers don't slow the scene down.
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
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
  }, [playing]);

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
  const jump = useCallback(
    (unit: number) => {
      // Reduced motion keeps the composed final row.
      if (reduced) return;
      setT(STARTS[unit]);
      setPlaying(true);
    },
    [reduced],
  );

  useReelKeyboard({
    t,
    end: END,
    steps: [...STARTS, FINALE],
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

  const finished = t >= END;
  const finale = t >= FINALE;
  const unit = STARTS.reduce((current, start, i) => (t >= start ? i : current), 0);
  const { section: sectionRef, strip: stripRef, style: fitStyle } = useStripFit();

  return (
    <section
      ref={sectionRef}
      className={`paper ${styles.journey}`}
      style={fitStyle}
      aria-labelledby="journey-reel-title"
      aria-keyshortcuts={REEL_KEYSHORTCUTS}
    >
      <header className={styles.head}>
        <span className={reel.eyebrow}>THE JOURNEY AHEAD</span>
        <h1 id="journey-reel-title">
          하나의 프로젝트를 <span>함께 만들어가는 여정.</span>
        </h1>
      </header>

      <ol
        ref={stripRef}
        className={`${styles.strip} ${finale ? styles.finale : ""}`}
        aria-label="하나의 페이지가 첫 파일, 첫 화면, 컴퓨터와 휴대폰 화면 수정, 항목을 누르면 열리는 동작, 배포와 다시 배포를 거치며 자라는 다섯 장면"
      >
        {workbookCourse.map((course, i) => {
          const state = finale || i < unit ? "done" : i === unit ? "active" : "future";
          return (
            <li
              key={course.title}
              className={styles.frame}
              data-state={state}
              aria-current={state === "active" ? "step" : undefined}
            >
              <button type="button" className={styles.frameHead} onClick={() => jump(i)}>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                <b>{course.title}</b>
                <em>{GAINS[i]}</em>
              </button>
              <div className={styles.screen} aria-hidden>
                {state !== "future" && (
                  <MiniPage stage={i} lt={state === "done" ? Infinity : t - STARTS[i]} />
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className={`${reel.subtitle} ${styles.subtitle}`} aria-live="polite">
        {finale ? (
          <p key="finale" className={reel.subtitleText}>
            <strong>처음부터 끝까지, 내 손으로 완성해봅니다.</strong>
          </p>
        ) : (
          <p key={unit} className={reel.subtitleText}>
            {LINES[unit]}
          </p>
        )}
      </div>
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
          className={reel.progress}
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
    </section>
  );
}

/** The same page at one unit's stage. `lt` is the time inside that unit (Infinity = its end). */
function MiniPage({ stage, lt }: { stage: number; lt: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  // Layout effect: the first paint already has the right scale, so a newly opened frame doesn't pop in.
  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    setScale(node.clientWidth / CANVAS_WIDTH);
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / CANVAS_WIDTH),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const at = (ms: number) => lt >= ms;
  const show = (visible: boolean) => (visible ? reel.in : reel.out);

  const plain = stage === 0;
  const withPhone = (stage === 2 && at(L.phone)) || stage === 4;
  const typed = WEB_ADDRESS.slice(
    0,
    Math.max(
      0,
      Math.min(
        WEB_ADDRESS.length,
        Math.ceil(((lt - L.typeStart) / (L.typeEnd - L.typeStart)) * WEB_ADDRESS.length),
      ),
    ),
  );
  const address =
    stage === 0
      ? at(L.title)
        ? FILE_ADDRESS
        : ""
      : stage === 4 && at(L.typeStart)
        ? typed
        : FILE_ADDRESS;
  const published = stage === 4 && at(L.typeEnd);
  const edited = stage === 4 && at(L.edit);
  const intro = edited ? EDITED_INTRO : PAGE_INTRO;
  const drafted = (i: number) => stage > 1 || (stage === 1 && at(L.draft[i]));

  const cursorMoved = at(L.toCard);
  const cursor = {
    visible: stage === 3 && at(L.cursorIn) && !at(L.detail + 500),
    x: cursorMoved ? 18 : 50,
    y: cursorMoved ? 78 : 104,
    click: stage === 3 && at(L.click) && !at(L.click + 400),
  };

  return (
    <div ref={box} className={styles.fit}>
      <div
        className={styles.canvas}
        style={{ transform: `scale(${scale})`, visibility: scale ? undefined : "hidden" }}
      >
        <div className={`${styles.browser} ${withPhone ? styles.withPhone : ""}`}>
          <div className={styles.chrome}>
            <span className={styles.dots}>
              <i />
              <i />
              <i />
            </span>
            <span className={`${styles.address} ${published ? styles.webAddress : ""}`}>
              {address}
              {stage === 4 && at(L.typeStart) && !at(L.typeEnd + 400) && (
                <span className={reel.caret} />
              )}
            </span>
          </div>
          <div className={styles.body}>
            <div className={`${styles.page} ${plain ? "" : styles.styled}`}>
              <h2 className={show(!plain || at(L.title))}>{PAGE_TITLE}</h2>
              {!plain && (
                <>
                  <p
                    className={`${styles.intro} ${show(drafted(0))} ${edited && lt !== Infinity ? styles.edited : ""}`}
                  >
                    {intro}
                  </p>
                  <div className={styles.cards}>
                    {PLACES.map((place, i) => (
                      <div
                        key={place.name}
                        className={`${styles.card} ${show(drafted(1 + i))} ${i === 0 && cursor.click ? styles.pressed : ""}`}
                      >
                        <span className={styles.swatch} data-tone={i} />
                        <b>{place.name}</b>
                        <small>{place.note}</small>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {stage === 3 && (
              <article className={`${styles.detail} ${show(at(L.detail))}`}>
                <small>← 목록으로</small>
                <span className={styles.swatch} data-tone={0} />
                <b>{PLACES[0].name}</b>
                <ul>
                  {NOTES.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </article>
            )}

            <span
              className={`${reel.cursor} ${show(cursor.visible)} ${cursor.click ? reel.clicking : ""}`}
              style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
            />
          </div>
        </div>

        {(stage === 2 || stage === 4) && (
          <div className={`${styles.phone} ${show(withPhone)}`}>
            {stage === 4 && (
              <span className={`${styles.phoneAddress} ${show(at(L.phoneAddress))}`}>
                {WEB_ADDRESS}
              </span>
            )}
            <div className={styles.phonePage}>
              <b>{PAGE_TITLE}</b>
              <p>{intro}</p>
              <div
                className={`${styles.phoneCards} ${stage === 4 || at(L.fixed) ? styles.stacked : ""} ${stage === 2 && at(L.clipped) && !at(L.fixed) ? styles.clipped : ""} ${stage === 2 && at(L.fixed) ? styles.fitted : ""}`}
              >
                {PLACES.map((place, i) => (
                  <span key={place.name}>
                    <i className={styles.swatch} data-tone={i} />
                    {place.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {stage === 0 && (
          <div className={`${styles.note} ${show(at(L.request))}`}>
            <small>AI에게 한 요청</small>
            <p>index.html 파일을 만들고 제목 한 줄을 넣어줘.</p>
            <span className={`${styles.file} ${show(at(L.file))}`}>index.html</span>
          </div>
        )}
        {stage === 1 && (
          <div
            className={`${styles.note} ${styles.plan} ${show(at(L.plan) && !at(L.draft[1]))} ${at(L.fold) ? styles.folded : ""}`}
          >
            <small>{at(L.fold) ? "기획을 요청으로" : "내 페이지 기획"}</small>
            <dl>
              <dt>누구에게</dt>
              <dd>혼자 책 읽을 곳을 찾는 사람</dd>
              <dt>담을 내용</dt>
              <dd>세 장소와 특징</dd>
            </dl>
          </div>
        )}
        {stage === 4 && (
          <span className={`${styles.badge} ${show(at(L.badge))}`}>
            다시 배포 · 같은 주소에 반영
          </span>
        )}
      </div>
    </div>
  );
}
