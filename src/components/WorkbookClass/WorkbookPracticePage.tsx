// 2-3의 연습 화면: 설계도로 그린 내 페이지 한 장(브라우저 창 모양). "before"는 연습용으로 한 곳을 일부러
// 다르게(practiceDifference) 그리고, "after"는 설계도대로 그린다. 실제 파일을 그린 것이 아니다.
import { planLines } from "@/lib/workbook-plan-readers";
import { practiceDifference, resultPieces } from "@/lib/workbook-result-check";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import styles from "./WorkbookPracticePage.module.scss";

/** 연습 화면에 그리는 카드 수. 나머지는 "그 밖에 n가지"로 줄인다(한 화면에 들어가게). */
const MAX_CARDS = 4;

export function WorkbookPracticePage({
  record,
  variant,
  onButton,
  label,
  tag,
}: {
  record: ProjectRecord;
  variant: "before" | "after";
  onButton?: () => void;
  label: string;
  /** 창 위에 붙이는 작은 꼬리표(예: "고치기 전"). */
  tag?: string;
}) {
  const pieces = resultPieces(record);
  const diff = variant === "before" ? practiceDifference(record) : null;
  const cards = planLines(record.content);
  const shownCards = diff === "order" ? [cards[1], cards[0], ...cards.slice(2)] : cards;
  const button = pieces.find((piece) => piece.id === "button")!.plan;
  return (
    <figure className={styles.window} aria-label={label}>
      <div className={styles.bar} aria-hidden="true">
        <i />
        <i />
        <i />
        <span>my-first-web/index.html</span>
        {tag && (
          <b className={styles.tag} data-side={variant === "before" ? "left" : "right"}>
            {tag}
          </b>
        )}
      </div>
      <div className={styles.page}>
        <strong className={styles.title}>{pieces[0].plan}</strong>
        <p className={styles.intro}>{pieces[1].plan}</p>
        <ul className={styles.cards}>
          {shownCards.slice(0, MAX_CARDS).map((card, index) => (
            <li key={`${card}-${index}`}>{card}</li>
          ))}
          {shownCards.length > MAX_CARDS && (
            <li className={styles.more}>그 밖에 {shownCards.length - MAX_CARDS}가지</li>
          )}
        </ul>
        {diff !== "button" &&
          (onButton ? (
            <button type="button" className={styles.cta} onClick={onButton}>
              {button}
            </button>
          ) : (
            <span className={styles.cta}>{button}</span>
          ))}
      </div>
    </figure>
  );
}
