"use client";

// Client component: 3-1 screen 3. The learner's page in a browser window with a handle on its right edge.
// Dragging the handle (or using the arrow keys on it — it is a slider) makes the window narrower or wider,
// and the page lays itself out again: one column on a phone-sized window, two or three content boxes as
// it widens, then title and content side by side. A short note says what just changed, and the word
// "반응형" is introduced once the learner has moved the handle. The page is drawn at the chosen width and
// shrunk to fit when the lesson column is narrower (WorkbookMyPage follows its own width).
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookMyPage, myPageOrSample } from "./WorkbookMyPage";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookResizeWindow.module.scss";

const MIN = 320;
const MAX = 1100;
/** 창 높이(화면에 보이는 크기). 실제 브라우저 창처럼 넘치는 아래는 창 안에서 스크롤한다. */
const HEIGHT = 278;
/** 폭 눈금. 이름은 대략의 기기 크기이며 특정 제품의 크기가 아니다. */
const MARKS = [
  { at: 360, label: "휴대폰" },
  { at: 768, label: "태블릿" },
  { at: 1100, label: "컴퓨터" },
] as const;

/** 지금 폭에서 페이지가 어떻게 놓였는지(WorkbookMyPage의 칸 나뉨 기준과 같은 값). */
function arrangement(width: number, twoColumns: boolean) {
  if (width >= 560 && twoColumns) return "제목과 내용이 왼쪽 · 오른쪽 두 칸으로 나뉘었어요";
  if (width >= 480) return "제목은 위에, 내용 칸은 세 개씩 나란히 놓였어요";
  if (width >= 400) return "내용 칸이 두 개씩 나란히 놓였어요";
  return "모든 내용이 위에서 아래로 한 줄로 쌓였어요";
}

/** 3-1 screen 3: drag the window and watch the page rearrange. */
export function WorkbookResizeWindow({ project }: { project: ProjectRecord }) {
  const [width, setWidth] = useWorkbookLessonState("responsive-window-width", 900);
  const [moved, setMoved] = useWorkbookLessonState("responsive-window-moved", false);
  const stage = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(MAX);
  const drag = useRef<{ x: number; width: number } | null>(null);
  const page = myPageOrSample(project, 3);
  const layout = page.layout ?? "two";
  const now = arrangement(width, layout === "two");

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setRoom(entry.contentRect.width - 28));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 수업 칸이 MAX보다 좁으면 같은 비율로 줄여 그린다(모바일에서도 컴퓨터 폭까지 넓혀 볼 수 있게).
  const scale = Math.min(1, room / MAX);
  function set(next: number) {
    const clamped = Math.round(Math.min(MAX, Math.max(MIN, next)));
    if (clamped !== width) {
      setWidth(clamped);
      setMoved(true);
    }
  }
  function onPointerDown(event: PointerEvent<HTMLSpanElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, width };
  }
  function onPointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (!drag.current) return;
    set(drag.current.width + (event.clientX - drag.current.x) / scale);
  }
  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    const step = {
      ArrowLeft: -20,
      ArrowDown: -20,
      ArrowRight: 20,
      ArrowUp: 20,
      PageDown: -100,
      PageUp: 100,
    }[event.key];
    if (step !== undefined) set(width + step);
    else if (event.key === "Home") set(MIN);
    else if (event.key === "End") set(MAX);
    else return;
    event.preventDefault();
  }

  return (
    <div data-lesson-wide className={styles.resize}>
      <h2 id="lesson-screen-title" className={styles.title}>
        크기에 맞춰 다시 놓이는 페이지
      </h2>
      <div className={styles.lead}>
        <p>
          창 오른쪽의 <strong>손잡이를 잡고</strong> 왼쪽 · 오른쪽으로 끌어 보세요. 창이 좁아지고
          넓어질 때 페이지가 어떻게 바뀌는지 봐요.
        </p>
      </div>

      <div ref={stage} className={styles.stage}>
        <div className={styles.window} style={{ width: width * scale }}>
          <span className={styles.frame} style={{ width, height: HEIGHT / scale, zoom: scale }}>
            <WorkbookMyPage {...page} layout={layout} mood={page.mood ?? "calm"} />
          </span>
          <span
            role="slider"
            tabIndex={0}
            className={styles.handle}
            aria-label="창 폭 손잡이"
            aria-valuemin={MIN}
            aria-valuemax={MAX}
            aria-valuenow={width}
            aria-valuetext={`${width}픽셀 · ${now}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={onKeyDown}
          >
            <i />
            <i />
          </span>
        </div>
        <div className={styles.ruler} style={{ width: MAX * scale }} aria-hidden="true">
          {MARKS.map((mark) => (
            <span
              key={mark.label}
              style={{ left: mark.at * scale }}
              data-near={Math.abs(width - mark.at) < 120}
            >
              {mark.label}
            </span>
          ))}
        </div>
      </div>

      <p className={styles.now} aria-live="polite">
        <b>지금</b> {now}
      </p>
      {moved ? (
        <p className={styles.closing}>
          이렇게 화면 크기에 맞춰 스스로 다시 놓이는 페이지를 <strong>반응형</strong> 페이지라고
          해요. 기기마다 따로 만들지 않고, 하나의 페이지가 알아서 맞춰져요.
        </p>
      ) : (
        <p className={styles.hint}>키보드로는 손잡이에 초점을 두고 ← → 키로 움직일 수 있어요.</p>
      )}
    </div>
  );
}
