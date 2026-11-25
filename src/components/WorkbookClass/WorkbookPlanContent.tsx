"use client";

// Client component: kinds of things the page could hold come up one card at a time, and the
// learner tosses each into "지금" (the plan's content) or "나중에" (the plan's later list). "지금" cards
// show up as sections on the learner's own page (WorkbookMyPage), so the page grows as they sort.
// Cards on the page or in the later box can be tapped to go back to the deck. Cards are kinds, not facts: what goes in each is
// asked for in 2-2.
import { planLines, type PlanReader } from "@/lib/workbook-plan-readers";
import { takenReferenceLabels } from "@/lib/workbook-plan-options";
import { workbookCourse, workbookProjectStep } from "@/lib/workbook-course";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookMyPage, myPageFromRecord } from "./WorkbookMyPage";
import styles from "./WorkbookPlanContent.module.scss";

const referencesLesson = workbookCourse[1].lessons[workbookProjectStep.references];

type Pile = "now" | "later";

/** 2-1 screen 4: sort the deck. Nothing to type. */
export function WorkbookPlanContent({
  record,
  reader,
  update,
}: {
  record: ProjectRecord;
  reader: PlanReader;
  update: (patch: Partial<ProjectRecord>) => void;
}) {
  const piles = { now: planLines(record.content), later: planLines(record.later) };
  const deck = reader.cards.filter(
    (card) => !piles.now.includes(card) && !piles.later.includes(card),
  );
  const top = deck[0];
  const taken = takenReferenceLabels(record.references);
  const page = myPageFromRecord(record);

  function write(next: Record<Pile, string[]>) {
    update({ content: next.now.join("\n"), later: next.later.join("\n") });
  }
  function toss(card: string, pile: Pile) {
    write({ ...piles, [pile]: [...piles[pile], card] });
  }
  function takeBack(card: string, pile: Pile) {
    write({ ...piles, [pile]: piles[pile].filter((line) => line !== card) });
  }

  return (
    <div data-lesson-wide className={styles.content}>
      <h2 id="lesson-screen-title" className={styles.title}>
        페이지에 넣을 내용을 골라요
      </h2>
      <div className={styles.lead}>
        <p>
          {reader.tag}에게 보여줄 만한 내용이 카드로 한 장씩 나와요. 지금 바로 소개할 수 있는
          내용이면 <strong>지금 넣기</strong>, 아직 준비가 안 됐다면 <strong>나중에 채우기</strong>
          로 보내 주세요. 없는 내용을 억지로 지어서 채울 필요는 없어요.
        </p>
      </div>

      {taken.length > 0 && (
        <p className={styles.refs}>
          {referencesLesson.number}에서 가져오기로 한 것 · <strong>{taken.join(" · ")}</strong> — 이
          구성에 맞는 내용을 골라 보세요.
        </p>
      )}
      <div className={styles.table}>
        <div className={styles.left}>
          <div className={styles.deck}>
            {top ? (
              <>
                <p className={styles.count}>
                  {reader.cards.length - deck.length + 1} / {reader.cards.length}
                </p>
                <div key={top} className={styles.card} aria-live="polite">
                  {top}
                </div>
                <div className={styles.toss}>
                  <button type="button" className={styles.later} onClick={() => toss(top, "later")}>
                    ← 나중에 채우기
                  </button>
                  <button type="button" className={styles.now} onClick={() => toss(top, "now")}>
                    지금 넣기 →
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.done} role="status">
                카드를 모두 나눴어요. 옮기고 싶은 카드는 페이지나 상자에서 누르면 다시 가져올 수
                있어요.
              </p>
            )}
          </div>

          <section className={styles.pile} data-pile="later" aria-label="나중에 채울 내용">
            <h3>나중에 채울 내용</h3>
            <PileCards cards={piles.later} pile="later" onTakeBack={takeBack} />
          </section>
        </div>

        <section className={styles.mine} aria-label="지금 넣을 내용">
          <WorkbookMyPage
            {...page}
            button={undefined}
            sections={
              piles.now.length
                ? piles.now.map((label) => ({ label, state: "filled" }))
                : [{ label: "", state: "empty" }]
            }
            onSection={(card) => takeBack(card, "now")}
            sectionAction="카드 다시 가져오기"
            caption="지금 넣기로 보낸 카드가 내 페이지에 칸으로 생겨요. 칸을 누르면 다시 가져와요."
          />
        </section>
      </div>
    </div>
  );
}

function PileCards({
  cards,
  pile,
  onTakeBack,
}: {
  cards: string[];
  pile: Pile;
  onTakeBack: (card: string, pile: Pile) => void;
}) {
  if (cards.length === 0) return <p className={styles.blank}>비어 있어요</p>;
  return (
    <ul>
      {cards.map((card) => (
        <li key={card}>
          <button
            type="button"
            aria-label={`${card} 카드 다시 가져오기`}
            onClick={() => onTakeBack(card, pile)}
          >
            {card}
          </button>
        </li>
      ))}
    </ul>
  );
}
