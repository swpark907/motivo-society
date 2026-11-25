// 2단원 기획 수업(2-1 · 2-2 · 2-3)의 "오늘 알게 된 것". 1단원처럼 수업마다 주제에 맞는 물건 하나로 정리한다.
//   2-1 방문자 카드 — 고른 읽을 사람의 인물 카드(상황 도장 · 바라는 버튼 · 기준). 알게 된 것은 옆에 끼운 쪽지.
//   2-2 스크랩북 펼침면 — 왼쪽에 가져온 조각, 오른쪽에 알게 된 것.
//   2-3 모눈종이 도면 — 고른 배치와 순서를 그린 도면, 알게 된 것은 도면의 설명 표시.
// 알게 된 것은 "굵은 한 줄 + 풀어 쓴 설명" 두 층이다. 들어올 때 움직임은 한 번이고 모션 줄이기에서는 멈춘다.
// 다음 수업은 아래 이동 바의 버튼이 맡고, 여기서는 한 줄로만 알린다.
import Image from "next/image";
import { Nanum_Pen_Script } from "next/font/google";
import type { CSSProperties } from "react";
import { workbookCourse } from "@/lib/workbook-course";
import { referenceExamples } from "@/lib/workbook-plan-options";
import type { PlanReader } from "@/lib/workbook-plan-readers";
import { WorkbookRefPartContent } from "./WorkbookRefPage";
import styles from "./WorkbookPlanRecaps.module.scss";

const hand = Nanum_Pen_Script({ weight: "400", subsets: ["latin"], display: "swap" });

export type RecapLine = { term: string; text: string };

/** 다음 수업 한 줄. 번호와 이름은 workbook-course.ts에서 읽는다. */
export function WorkbookRecapNext({ point, text }: { point: number; text: string }) {
  const next = workbookCourse[1].lessons[point + 1];
  return (
    <p className={styles.next}>
      다음 수업 · <b>{`${next.number} ${next.title}`}</b> — {text}
    </p>
  );
}

/** 알게 된 것 목록. variant는 물건에 맞춘 모양(쪽지 · 테이프 · 설명 표시). */
export function WorkbookRecapLines({
  lines,
  variant,
}: {
  lines: readonly RecapLine[];
  variant: "slip" | "tape" | "callout";
}) {
  const className = { slip: styles.slipList, tape: styles.tapedList, callout: styles.callouts }[
    variant
  ];
  return (
    <ol className={className} aria-label="오늘 알게 된 것">
      {lines.map((line, index) => (
        <li key={line.term} style={{ "--i": index } as CSSProperties}>
          <strong>{line.term}</strong>
          <span>{line.text}</span>
        </li>
      ))}
    </ol>
  );
}

/** 2-1에서 고른 읽을 사람을 담은 방문자 카드. 2-1 정리와 3-1 화면 5가 같이 쓴다(기준은 줄 때만 그린다). */
export function WorkbookVisitorCard({
  reader,
  audience,
  situation,
  button,
  criteria,
  className,
}: {
  reader: PlanReader | null;
  audience: string;
  situation: readonly string[];
  button: string;
  criteria?: readonly string[];
  className?: string;
}) {
  return (
    <div className={`${styles.recap} ${className ?? ""}`}>
      <article className={styles.card} aria-label="방문자 카드">
        <header>
          <span>VISITOR</span>
          <span>내 페이지의 방문자 카드</span>
        </header>
        <div className={styles.cardBody}>
          <span className={styles.photo} aria-hidden="true">
            <Image
              src="/images/workbook/lesson-1-2/capy-thumb.png"
              alt=""
              width={295}
              height={480}
            />
          </span>
          <div className={styles.who}>
            <strong className={hand.className}>{reader?.tag ?? "읽을 사람"}</strong>
            <small>{audience || "아직 고르지 않았어요"}</small>
          </div>
        </div>
        <dl className={styles.facts}>
          <div>
            <dt>상황</dt>
            <dd className={styles.stamps}>
              {situation.length ? (
                situation.map((label, index) => (
                  <span key={label} style={{ "--i": index } as CSSProperties}>
                    {label}
                  </span>
                ))
              ) : (
                <em>아직 고르지 않았어요</em>
              )}
            </dd>
          </div>
          <div>
            <dt>바라는 버튼</dt>
            <dd>
              {button ? (
                <span className={styles.button}>{button}</span>
              ) : (
                <em>아직 고르지 않았어요</em>
              )}
            </dd>
          </div>
          {criteria && (
            <div>
              <dt>잘 됐다는 기준</dt>
              <dd>
                {criteria.length ? (
                  <ul className={styles.checks}>
                    {criteria.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <em>아직 고르지 않았어요</em>
                )}
              </dd>
            </div>
          )}
        </dl>
      </article>
    </div>
  );
}

/** 2-1: 방문자 카드. */
export function WorkbookAudienceRecap({
  point,
  lines,
  reader,
  audience,
  situation,
  button,
  criteria,
}: {
  point: number;
  lines: readonly RecapLine[];
  reader: PlanReader | null;
  audience: string;
  situation: readonly string[];
  button: string;
  criteria: readonly string[];
}) {
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>
      <div className={styles.visitor}>
        <WorkbookVisitorCard
          reader={reader}
          audience={audience}
          situation={situation}
          button={button}
          criteria={criteria}
        />
        <div className={styles.slips}>
          <WorkbookRecapLines lines={lines} variant="slip" />
          <WorkbookRecapNext point={point} text="비슷한 페이지 세 장을 보고 가져올 것을 골라요." />
        </div>
      </div>
    </div>
  );
}

/** 2-2: 스크랩북 펼침면. */
export function WorkbookReferencesRecap({
  point,
  lines,
  takenIds,
  dropped,
}: {
  point: number;
  lines: readonly RecapLine[];
  takenIds: readonly string[];
  dropped: number;
}) {
  const parts = takenIds
    .map((id) => {
      const index = referenceExamples.findIndex((example) =>
        example.parts.some((item) => item.id === id),
      );
      if (index < 0) return null;
      const part = referenceExamples[index].parts.find((item) => item.id === id)!;
      return { id, letter: "ABC"[index], label: part.label };
    })
    .filter((part): part is { id: string; letter: string; label: string } => part !== null);
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>
      <div className={styles.spread}>
        <section className={styles.leftPage} aria-label="스크랩북 왼쪽 · 가져온 것">
          <h3 className={hand.className}>가져온 조각</h3>
          {parts.length ? (
            <ul className={styles.stickers}>
              {parts.map((part, index) => (
                <li key={part.id} style={{ "--i": index } as CSSProperties}>
                  <span className={styles.sticker} aria-hidden="true">
                    <WorkbookRefPartContent id={part.id} />
                  </span>
                  <span className={hand.className}>
                    예시 {part.letter} · {part.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.blank}>가져온 조각이 없어요. 고르기 화면에서 붙일 수 있어요.</p>
          )}
          <dl className={styles.tally}>
            <div>
              <dt>가져올 것</dt>
              <dd>{parts.map((part) => part.label).join(" · ") || "아직 고르지 않았어요"}</dd>
            </div>
            <div>
              <dt>뺄 것</dt>
              <dd>{dropped ? `${dropped}가지` : "없음"}</dd>
            </div>
          </dl>
        </section>
        <section className={styles.rightPage} aria-label="스크랩북 오른쪽 · 알게 된 것">
          <WorkbookRecapLines lines={lines} variant="tape" />
          <WorkbookRecapNext point={point} text="넣을 내용을 고르고 순서와 배치를 정해요." />
        </section>
      </div>
    </div>
  );
}

/** 2-3: 모눈종이 도면. */
export function WorkbookStructureRecap({
  point,
  lines,
  title,
  content,
  later,
  layout,
  layoutLabel,
  fold,
}: {
  point: number;
  lines: readonly RecapLine[];
  title: string;
  content: readonly string[];
  later: readonly string[];
  layout: string;
  layoutLabel: string;
  fold: number;
}) {
  const shown = content.slice(0, 5);
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>
      <div className={styles.drawing}>
        <svg className={styles.grid} aria-hidden="true">
          <defs>
            <pattern id="plan-recap-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M16 0H0V16" fill="none" stroke="currentColor" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#plan-recap-grid)" />
        </svg>
        <figure className={styles.plan} data-layout={layout || "stack"} aria-label="내 페이지 도면">
          {layout === "hero" && <span className={styles.heroBox}>큰 사진</span>}
          <span className={styles.titleBox}>{title}</span>
          <ol className={styles.boxes}>
            {shown.map((card, index) => (
              <li key={`${card}-${index}`} data-below={index >= fold}>
                <b>{index + 1}</b> {card}
                {index === fold - 1 && shown.length > fold && (
                  <i className={styles.fold}>여기까지 첫 화면</i>
                )}
              </li>
            ))}
            {shown.length === 0 && <li>넣을 내용 없음</li>}
          </ol>
        </figure>
        <div className={styles.notes}>
          <WorkbookRecapLines lines={lines} variant="callout" />
          <dl className={styles.titleBlock} aria-label="도면 정보">
            <div>
              <dt>배치</dt>
              <dd>{layoutLabel || "아직 고르지 않았어요"}</dd>
            </div>
            <div>
              <dt>나중에 채울 것</dt>
              <dd>{later.join(" · ") || "없음"}</dd>
            </div>
          </dl>
          <WorkbookRecapNext
            point={point}
            text="제목 · 버튼 문구 · 분위기를 정하고 기획서 한 장으로 모아요."
          />
        </div>
      </div>
    </div>
  );
}
