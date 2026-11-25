"use client";

// Client component: 3-1 screen 4. The same page — the learner's title and content, plus a menu and a
// picture so all four kinds of change show — drawn wide (computer) and narrow (phone) side by side.
// Four buttons name what changes when the screen narrows: columns, text size, picture size, menu.
// Pressing one outlines that part in both pages and says how it changed. These four are what the
// later "자주 깨지는 곳" lesson checks.
import Image from "next/image";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { myPageOrSample } from "./WorkbookMyPage";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookShrinkChanges.module.scss";

const CHANGES = [
  {
    id: "columns",
    label: "칸 수",
    text: "넓을 때 나란히 놓였던 칸이, 좁은 화면에서는 위아래로 쌓여요.",
  },
  {
    id: "text",
    label: "글자 크기",
    text: "큰 제목은 좁은 화면에서 조금 작아져요. 본문 글자는 읽을 수 있는 크기를 지켜요.",
  },
  {
    id: "picture",
    label: "그림 크기",
    text: "그림은 화면 폭에 맞춰 함께 줄어들어요. 옆이 잘리지 않게 비율을 지켜요.",
  },
  {
    id: "menu",
    label: "메뉴",
    text: "옆으로 늘어서 있던 메뉴가 좁은 화면에서는 줄 세 개 모양 버튼 하나로 접혀요. 누르면 펼쳐져요.",
  },
] as const;
type ChangeId = (typeof CHANGES)[number]["id"];

const MENU = ["소개", "작업", "연락"];
const PICTURE = "/images/workbook/study-v3.png";

function Site({
  wide,
  page,
  on,
}: {
  wide: boolean;
  page: ReturnType<typeof myPageOrSample>;
  on: ChangeId | null;
}) {
  const mark = (id: ChangeId) => (on === id ? "true" : undefined);
  return (
    <div className={styles.site} data-wide={wide}>
      <div className={styles.nav} data-on={mark("menu")}>
        <b>내 페이지</b>
        {wide ? (
          <span className={styles.links}>
            {MENU.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </span>
        ) : (
          <span className={styles.burger} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
      <span className={styles.picture} data-on={mark("picture")}>
        <Image src={PICTURE} alt="" fill sizes="(min-width: 768px) 40vw, 80vw" />
      </span>
      <strong className={styles.heading} data-on={mark("text")}>
        {page.title}
      </strong>
      <ul className={styles.cards} data-on={mark("columns")}>
        {page.sections.slice(0, 3).map((section) => (
          <li key={section.label}>
            <b>{section.label}</b>
            <i />
            <i />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 3-1 screen 4: what changes when the screen gets narrow. */
export function WorkbookShrinkChanges({ project }: { project: ProjectRecord }) {
  const [on, setOn] = useWorkbookLessonState<ChangeId | null>("responsive-change", null);
  const page = myPageOrSample(project, 3);
  const current = CHANGES.find((change) => change.id === on);
  return (
    <div data-lesson-wide className={styles.changes}>
      <h2 id="lesson-screen-title" className={styles.title}>
        화면이 좁아지면 무엇이 바뀔까
      </h2>
      <div className={styles.lead}>
        <p>
          같은 페이지를 컴퓨터와 휴대폰 크기로 나란히 놓았어요. 메뉴와 사진이 있는 페이지라면,
          화면이 좁아질 때 <strong>네 가지</strong>가 바뀌어요. 네 가지 버튼을 하나씩 눌러 보세요.
        </p>
      </div>

      <div className={styles.desk}>
        <div className={styles.pair}>
          <figure className={styles.wide}>
            <Site wide page={page} on={on} />
            <figcaption>컴퓨터</figcaption>
          </figure>
          <figure className={styles.narrow}>
            <Site wide={false} page={page} on={on} />
            <figcaption>휴대폰</figcaption>
          </figure>
        </div>

        <div className={styles.controls}>
          <ul aria-label="화면이 좁아지면 바뀌는 것">
            {CHANGES.map((change) => (
              <li key={change.id}>
                <button
                  type="button"
                  aria-pressed={on === change.id}
                  onClick={() => setOn(on === change.id ? null : change.id)}
                >
                  {change.label}
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.explain} aria-live="polite">
            {current ? (
              <>
                <b>{current.label}</b> {current.text}
              </>
            ) : (
              "누르면 두 화면에서 그 부분이 표시돼요."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
