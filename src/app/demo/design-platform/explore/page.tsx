import Link from "next/link";
import { CoverCard } from "../_card";
import { Icon } from "../_icons";
import { ACTIVITIES } from "../_mock";
import s from "../design.module.scss";

const CHIPS = ["전체", "모임", "시즌", "챌린지", "온라인", "오프라인", "이번 주", "무료"];

export default function ExploreDraft() {
  const thisWeek = ACTIVITIES.filter((a) => a.kind === "gathering" && !a.live);
  const joinable = ACTIVITIES.filter((a) => a.live);
  return (
    <>
      <header className={s.pageHead}>
        <h1 className={s.h1}>함께할 거리를 찾아보세요</h1>
        <div>
          <label className={s.search}>
            <Icon name="search" />
            <input
              type="search"
              placeholder="모임·시즌·챌린지, 클럽 이름으로 찾기"
              aria-label="활동 검색"
            />
          </label>
          <div className={s.chips} role="group" aria-label="필터">
            {CHIPS.map((c, i) => (
              <button key={c} type="button" className={s.chip} aria-pressed={i === 0}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section aria-labelledby="week-h">
        <div className={s.sectionHead}>
          <div>
            <h2 id="week-h">이번 주에 열리는 모임</h2>
            <p>오늘부터 7일 안에 모여요</p>
          </div>
          <Link href="#all">모두 보기</Link>
        </div>
        <ul className={s.row}>
          {thisWeek.map((a) => (
            <li key={a.slug}>
              <CoverCard a={a} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="live-h">
        <div className={s.sectionHead}>
          <div>
            <h2 id="live-h">지금 합류할 수 있어요</h2>
            <p>이미 시작했지만 중간부터 함께할 수 있는 시즌·챌린지</p>
          </div>
        </div>
        <ul className={s.row}>
          {joinable.map((a) => (
            <li key={a.slug}>
              <CoverCard a={a} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="all-h" id="all">
        <div className={s.sectionHead}>
          <div>
            <h2 id="all-h">전체 활동</h2>
            <p>{ACTIVITIES.length}개 · 가까운 일정 순</p>
          </div>
        </div>
        <ul className={s.grid}>
          {ACTIVITIES.map((a) => (
            <li key={a.slug}>
              <CoverCard a={a} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
