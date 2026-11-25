"use client";

// Client component: 3-1 screen 2. The same page of the learner's on five kinds of screens, side by side:
// phone, foldable (fold / unfold), tablet (portrait / turned), laptop, big monitor. Each screen draws the
// page at that device's own width and shrinks it to fit, so the page really lays itself out differently
// (one column on narrow screens, two columns on wide ones — WorkbookMyPage follows its own width).
// Widths are rough sizes for the picture, not specs of any product.
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookMyPage, myPageOrSample } from "./WorkbookMyPage";
import styles from "./WorkbookDeviceShelf.module.scss";

type Screen = { css: number; width: number; height: number };

function DeviceScreen({ screen, project }: { screen: Screen; project: ProjectRecord }) {
  const page = myPageOrSample(project, 3);
  return (
    <span className={styles.screen} style={{ width: screen.width, height: screen.height }}>
      <span className={styles.page} style={{ width: screen.css, zoom: screen.width / screen.css }}>
        <WorkbookMyPage {...page} layout={page.layout ?? "two"} mood={page.mood ?? "calm"} />
      </span>
    </span>
  );
}

/** 3-1 screen 2: screen sizes differ from device to device. */
export function WorkbookDeviceShelf({ project }: { project: ProjectRecord }) {
  const [unfolded, setUnfolded] = useWorkbookLessonState("responsive-fold-open", false);
  const [turned, setTurned] = useWorkbookLessonState("responsive-tablet-turned", false);
  return (
    <div data-lesson-wide className={styles.shelf}>
      <h2 id="lesson-screen-title" className={styles.title}>
        화면 크기는 기기마다 달라요
      </h2>
      <div className={styles.lead}>
        <p>
          휴대폰, 접히는 폰, 태블릿, 노트북, 큰 모니터. 모두 같은 내 페이지를 띄웠는데{" "}
          <strong>놓이는 모양이 달라요</strong>. 같은 기기도 접고 펴거나 돌리면 화면 크기가
          바뀌어요.
        </p>
      </div>

      <ul className={styles.devices} aria-label="화면 크기가 다른 기기">
        <li>
          <span className={styles.phone}>
            <DeviceScreen project={project} screen={{ css: 380, width: 84, height: 164 }} />
          </span>
          <strong>휴대폰</strong>
          <small>세로로 좁아서 한 줄로 쌓여요</small>
        </li>

        <li>
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={unfolded}
            aria-label={`접히는 폰 ${unfolded ? "접기" : "펼치기"}`}
            onClick={() => setUnfolded(!unfolded)}
          >
            {unfolded ? "접기" : "펼치기"}
          </button>
          <span className={styles.phone} data-open={unfolded}>
            <DeviceScreen
              project={project}
              screen={
                unfolded
                  ? { css: 760, width: 168, height: 164 }
                  : { css: 380, width: 76, height: 164 }
              }
            />
          </span>
          <strong>접히는 폰</strong>
          <small>{unfolded ? "펼치면 태블릿만큼 넓어져요" : "접으면 휴대폰처럼 좁아요"}</small>
          <small className={styles.example}>예: 갤럭시 Z 폴드8 · 2026년 11월 확인</small>
        </li>

        <li>
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={turned}
            aria-label={`태블릿 ${turned ? "세로로 돌리기" : "가로로 돌리기"}`}
            onClick={() => setTurned(!turned)}
          >
            {turned ? "세로로 돌리기" : "가로로 돌리기"}
          </button>
          <span className={styles.tablet}>
            <DeviceScreen
              project={project}
              screen={
                turned
                  ? { css: 1000, width: 200, height: 140 }
                  : { css: 540, width: 132, height: 172 }
              }
            />
          </span>
          <strong>태블릿</strong>
          <small>
            {turned
              ? "가로로 돌리면 제목과 내용이 두 칸으로 나뉘어요"
              : "세로로 들면 제목과 내용이 위아래로 놓여요"}
          </small>
        </li>

        <li>
          <span className={styles.laptop}>
            <DeviceScreen project={project} screen={{ css: 1280, width: 220, height: 138 }} />
          </span>
          <strong>노트북</strong>
          <small>넓어서 두 칸으로 나뉘어요</small>
        </li>

        <li>
          <span className={styles.monitor}>
            <DeviceScreen project={project} screen={{ css: 1600, width: 280, height: 158 }} />
          </span>
          <strong>큰 모니터</strong>
          <small>가장 넓은 화면이에요</small>
        </li>
      </ul>

      <p className={styles.closing}>
        기기마다 페이지를 따로 만들 수는 없어요. 그래서{" "}
        <strong>하나의 페이지가 화면 크기에 맞춰</strong> 스스로 다시 놓이게 만들어요. 다음 화면에서
        직접 늘였다 줄였다 해 볼게요.
      </p>
    </div>
  );
}
