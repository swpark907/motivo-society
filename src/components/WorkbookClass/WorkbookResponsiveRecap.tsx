// 3-1 정리: 오늘 알게 된 것을 펼친 줄자 위에 붙인다(2단원 방문자 카드 · 스크랩북 · 도면 · 봉투처럼 수업마다 다른 물건).
// 줄자가 한 번 쭉 펼쳐지고, 눈금 1~4에 쪽지가 매달린다. 모션 줄이기에서는 펼친 채로 보인다.
// 알게 된 것은 "굵은 한 줄 + 설명" 두 층이고, 다음 수업은 아래 버튼이 맡아 한 줄로만 알린다.
import type { CSSProperties } from "react";
import { workbookCourse } from "@/lib/workbook-course";
import styles from "./WorkbookResponsiveRecap.module.scss";

const LEARNED = [
  {
    term: "화면 크기는 기기마다 달라요",
    text: "휴대폰 · 접히는 폰 · 태블릿 · 노트북 · 큰 모니터. 같은 기기도 접거나 돌리면 바뀌어요.",
  },
  {
    term: "반응형은 하나의 페이지가 스스로 다시 놓이는 것",
    text: "기기마다 페이지를 따로 만들지 않고, 화면 크기에 맞춰 다시 놓이게 만들어요.",
  },
  {
    term: "좁아지면 네 가지가 바뀌어요",
    text: "칸 수 · 글자 크기 · 그림 크기 · 메뉴. 휴대폰 화면을 볼 때 이 네 가지를 먼저 봐요.",
  },
  {
    term: "볼 사람이 쓰는 화면부터 확인해요",
    text: "휴대폰으로 본다면, 또는 무엇으로 볼지 모르겠다면 휴대폰 화면부터 확인해요.",
  },
] as const;

export function WorkbookResponsiveRecap({ point }: { point: number }) {
  const next = workbookCourse[2].lessons[point + 1];
  return (
    <div data-lesson-wide className={styles.recap}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘 알게 된 것
      </h2>
      <div className={styles.tape} aria-hidden="true">
        <span className={styles.case} />
        <svg className={styles.ruler} preserveAspectRatio="none">
          <defs>
            <pattern
              id="responsive-recap-ticks"
              width="12"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0.5 0V10" stroke="currentColor" strokeWidth="1" />
              <path d="M6.5 0V6" stroke="currentColor" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#responsive-recap-ticks)" />
        </svg>
        {LEARNED.map((_, index) => (
          <b key={index} style={{ left: `${16 + index * 23}%` }}>
            {index + 1}
          </b>
        ))}
        <span className={styles.hook} />
      </div>
      <ol className={styles.lines} aria-label="오늘 알게 된 것">
        {LEARNED.map((line, index) => (
          <li key={line.term} style={{ "--i": index } as CSSProperties}>
            <strong>{line.term}</strong>
            <span>{line.text}</span>
          </li>
        ))}
      </ol>
      <p className={styles.next}>
        다음 수업 · <b>{`${next.number} ${next.title}`}</b> — 내 페이지를 직접 다른 크기로 열어
        확인해요.
      </p>
    </div>
  );
}
