import Link from "next/link";
import { ACTIVITIES, KIND_LABEL, priceLabel, seatsLabel } from "../../design-platform/_mock";
import { bigDate, PosterCard, SecHead } from "../_parts";
import s from "../poster.module.scss";

const BASE = "/demo/design-poster";
const WEEK = ACTIVITIES.filter((a) => !a.live && ["오늘", "D-3", "D-5"].includes(a.day));
const LIVE = ACTIVITIES.filter((a) => a.live);
// 위 묶음에 나온 활동은 시간표에 다시 넣지 않는다.
const LATER = ACTIVITIES.filter((a) => !WEEK.includes(a) && !LIVE.includes(a));
const FILTERS: [string, boolean][] = [
  ["전체", true],
  ["모임", false],
  ["시즌", false],
  ["챌린지", false],
  ["무료", false],
];

/** 둘러보기 시안: 거대한 제목 → 종류 글자 필터 → 이번 주 포스터 → 합류 가능 → 시간표. */
export default function PosterExplore() {
  return (
    <div className={s.wrap}>
      <header className={s.head}>
        <div className={s.headRow}>
          <div>
            <p className={s.label}>Explore · 모집 중 {ACTIVITIES.length}개</p>
            <h1 className={`${s.display} ${s.headHuge}`}>둘러보기</h1>
          </div>
          <p className={s.headSub}>
            혼자 하면 미루는 것을 같이 하러 가요. 이미 시작한 것도 합류할 수 있으면 보여 드려요.
          </p>
        </div>
        <div className={s.filters} role="group" aria-label="종류">
          {FILTERS.map(([label, on]) => (
            <button key={label} type="button" aria-pressed={on}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className={s.section}>
        <SecHead label="This week" title="이번 주" />
        <div className={s.posters}>
          {WEEK.map((a) => (
            <PosterCard key={a.slug} a={a} base={BASE} />
          ))}
        </div>
      </section>

      <section className={s.section}>
        <SecHead label="Join now" title="지금 합류할 수 있어요" />
        <div className={s.posters}>
          {LIVE.map((a) => (
            <PosterCard key={a.slug} a={a} base={BASE} />
          ))}
        </div>
      </section>

      <section className={s.section}>
        <SecHead label="Timetable" title="그다음 일정" />
        <div className={s.table}>
          {LATER.map((a) => {
            const d = bigDate(a);
            const seats = seatsLabel(a);
            return (
              <Link key={a.slug} href={`${BASE}/activity`} className={s.tRow}>
                <span className={`${s.display} ${s.tDate}`}>{d.big}</span>
                <span className={s.tDay}>{d.day}</span>
                <span className={s.tMain}>
                  <span className={s.tTitle}>{a.title}</span>
                  <span className={s.tSub}>
                    {KIND_LABEL[a.kind]} · {a.online ? "온라인" : a.place} · {a.host}
                  </span>
                </span>
                <span className={s.tEnd}>
                  <span className={seats.includes("남음") ? s.low : undefined}>{seats}</span>
                  <strong>{priceLabel(a.price)}</strong>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
