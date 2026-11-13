import Link from "next/link";
import { ACTIVITIES, KIND_LABEL, priceLabel, seatsLabel } from "../../design-platform/_mock";
import { CapySays, NoteCard, SecHead } from "../_parts";
import s from "../notebook.module.scss";

const WEEK = ACTIVITIES.filter((a) => !a.live && ["오늘", "D-3", "D-5"].includes(a.day));
const LIVE = ACTIVITIES.filter((a) => a.live);
// 위 두 묶음에 나온 활동은 아래 목록에서 다시 보여 주지 않는다(지금 화면의 중복 해소).
const LATER = ACTIVITIES.filter((a) => !WEEK.includes(a) && !LIVE.includes(a));

const FILTERS: [string, boolean][][] = [
  [
    ["모임", false],
    ["시즌", false],
    ["챌린지", false],
  ],
  [
    ["온라인", false],
    ["오프라인", false],
  ],
  [
    ["이번 주", true],
    ["다음 주", false],
  ],
  [["무료", false]],
];

/** 둘러보기 시안: 검은 머리 띠 → 이번 주 카드 → 지금 합류 → 그다음 일정은 장부형 목록. */
export default function NotebookExplore() {
  return (
    <>
      <header className={s.band}>
        <span className={s.ghost} aria-hidden="true">
          PLAY
        </span>
        <div className={`${s.wrap} ${s.bandInner}`}>
          <div className={s.bandContent}>
            <p className={s.bandMeta}>
              <span className={s.bandBrand}>Explore</span>
              <span>모집 중 {ACTIVITIES.length}개</span>
            </p>
            <h1 className={s.bandTitle}>
              혼자 하면 미루는 것,
              <br />
              <em>같이</em> 하러 가요.
            </h1>
            <p className={s.bandLead}>
              모임 · 시즌 · 챌린지. 이미 시작한 것도 중간에 합류할 수 있으면 보여 드려요.
            </p>
          </div>
        </div>
      </header>

      <div className={s.wrap}>
        <section className={s.section} aria-label="조건">
          <div className={s.filters}>
            {FILTERS.map((group, gi) => (
              <span key={gi} style={{ display: "contents" }}>
                {gi > 0 && <span className={s.chipGap} aria-hidden="true" />}
                {group.map(([label, on]) => (
                  <button key={label} type="button" className={s.chip} aria-pressed={on}>
                    {label}
                  </button>
                ))}
              </span>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <SecHead no="01" eyebrow="This week" title="이번 주에 열리는 것" />
          <div className={s.cards}>
            {WEEK.map((a) => (
              <NoteCard key={a.slug} a={a} />
            ))}
          </div>
        </section>

        <section className={s.section}>
          <SecHead no="02" eyebrow="Join now" title="지금 합류할 수 있어요" />
          <div className={s.cards}>
            {LIVE.map((a) => (
              <NoteCard key={a.slug} a={a} />
            ))}
          </div>
          <CapySays>시작한 지 좀 됐어도 괜찮아요. 오늘부터 같이 하면 돼요.</CapySays>
        </section>

        <section className={s.section}>
          <SecHead no="03" eyebrow="Coming up" title="그다음 일정" />
          <div className={s.ledger}>
            <p className={s.ledgerDay}>NEXT WEEK</p>
            {LATER.map((a) => {
              const m = a.when.match(/(\d{1,2}\.\d{1,2})\s*\((.)\)/);
              return (
                <Link key={a.slug} href="/demo/design-notebook/activity" className={s.ledgerRow}>
                  <span className={s.ledgerDate}>
                    {m ? m[1] : a.day}
                    <small>{m ? `${m[2]}요일` : ""}</small>
                  </span>
                  <span className={s.ledgerMain}>
                    <span className={s.eyebrow}>{KIND_LABEL[a.kind]}</span>
                    <span className={s.ledgerTitle}>{a.title}</span>
                    <span className={s.cardMeta}>
                      {a.online ? "온라인" : a.place} · {a.host}
                    </span>
                  </span>
                  <span className={s.ledgerEnd}>
                    <strong>{priceLabel(a.price)}</strong>
                    <span className={seatsLabel(a).includes("남음") ? s.seatsLow : undefined}>
                      {seatsLabel(a)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
