// 2단원 내내 쓰는 "내 페이지" 미리보기. 1단원에서 만든 index.html이 기획을 고를 때마다 자라는 모습을
// 실제 웹페이지처럼 그린다. 칸(section)은 세 가지 상태다.
//   empty  — 아직 아무것도 정하지 않은 빈 자리(점선)
//   wanted — 읽을 사람이 찾는데 아직 없는 자리(점선 + 이름)
//   filled — 정한 내용이 들어갈 자리(제목 + 내용 줄). 실제 내용은 지어내지 않고 줄로만 그린다.
// 학습자가 고른 버튼 문구 · 분위기 · 배치를 받아 그대로 그린다. 상태를 갖지 않는다.
import type { CSSProperties, ReactNode } from "react";
import { moodOptions } from "@/lib/workbook-plan-options";
import { Nanum_Myeongjo } from "next/font/google";
import { ASK_INTRO, findPlanButton, planLines } from "@/lib/workbook-plan-readers";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { FIRST_PAGE_TITLE } from "./WorkbookFileAsk";
import styles from "./WorkbookMyPage.module.scss";

const serif = Nanum_Myeongjo({ weight: "800", subsets: ["latin"], display: "swap" });

export type MyPageSection = { label: string; state: "empty" | "wanted" | "filled" };
export type MyPageLayout = "stack" | "two" | "hero";

/** 기획 기록에서 지금까지 정한 만큼의 내 페이지를 만든다. 정하지 않은 것은 그리지 않는다. */
export function myPageFromRecord(record: ProjectRecord, limit = 6) {
  const cards = planLines(record.content).slice(0, limit);
  const button = record.buttonLabel.trim() || findPlanButton(record.purpose)?.label;
  return {
    title: record.title.trim() || FIRST_PAGE_TITLE,
    // "AI가 물어보고 채워 줘"라는 요청 문장은 페이지에 보일 글이 아니라서 빈 자리로 그린다.
    intro: record.intro.trim() === ASK_INTRO ? "" : record.intro.trim(),
    sections: cards.map((label) => ({ label, state: "filled" as const })),
    button,
    mood: record.mood || undefined,
    layout: (record.layout || undefined) as MyPageLayout | undefined,
  };
}

export function WorkbookMyPage({
  title,
  intro,
  sections,
  button,
  mood,
  layout = "stack",
  caption,
  overlay,
  onSection,
  sectionAction,
}: {
  title: string;
  intro: string;
  sections: readonly MyPageSection[];
  button?: string;
  mood?: string;
  layout?: MyPageLayout;
  caption?: ReactNode;
  overlay?: ReactNode;
  /** 주면 채운 칸을 누를 수 있다(예: 2-3에서 카드 다시 빼기). */
  onSection?: (label: string) => void;
  /** 누를 수 있는 칸의 접근 이름 뒤에 붙는 말. */
  sectionAction?: string;
}) {
  const palette = moodOptions.find((option) => option.id === mood)?.colors;
  return (
    <figure
      className={styles.window}
      style={
        palette
          ? ({
              "--my-paper": palette.paper,
              "--my-ink": palette.ink,
              "--my-accent": palette.accent,
            } as CSSProperties)
          : undefined
      }
      data-layout={layout}
    >
      <div className={styles.bar} aria-hidden="true">
        <i />
        <i />
        <i />
        <span>my-first-web / index.html</span>
      </div>
      <div className={styles.page}>
        {layout === "hero" && (
          <span className={styles.hero}>큰 사진 자리 · 사진은 내가 나중에 넣어요</span>
        )}
        <div className={styles.head}>
          <strong className={`${styles.pageTitle} ${mood === "warm" ? serif.className : ""}`}>
            {title}
          </strong>
          {intro ? (
            <p className={styles.intro}>{intro}</p>
          ) : (
            <p className={styles.introEmpty}>소개 글이 들어갈 자리</p>
          )}
        </div>
        {sections.length > 0 && (
          <ul className={styles.sections}>
            {sections.map((section, index) => (
              <li key={`${section.label}-${index}`} data-state={section.state}>
                {section.state === "filled" ? (
                  onSection ? (
                    <button
                      type="button"
                      className={styles.filled}
                      aria-label={`${section.label}${sectionAction ? ` ${sectionAction}` : ""}`}
                      onClick={() => onSection(section.label)}
                    >
                      <Filled label={section.label} />
                    </button>
                  ) : (
                    <span className={styles.filled}>
                      <Filled label={section.label} />
                    </span>
                  )
                ) : section.state === "wanted" ? (
                  <span>
                    <small>아직 없음</small> {section.label}
                  </span>
                ) : (
                  <span className={styles.blank}>빈 자리</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {button && <span className={styles.cta}>{button}</span>}
        {overlay}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Filled({ label }: { label: string }) {
  return (
    <>
      <b>{label}</b>
      <span className={styles.text} aria-hidden="true">
        <i />
        <i />
      </span>
    </>
  );
}
