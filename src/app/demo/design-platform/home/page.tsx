import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/Avatar/Avatar";
import { CoverCard } from "../_card";
import { Icon } from "../_icons";
import { ACTIVITIES } from "../_mock";
import h from "./home.module.scss";
import s from "../design.module.scss";

// 시안: 로그인한 회원의 홈. 대시보드가 아니라 위에서 아래로 읽는 하루 — 오늘 → 내 사람들 → 발견.
const FEED = [
  {
    who: "참가자1",
    what: "2주 매일 하나씩 만들기 · 4일차",
    body: "오늘은 랜딩 히어로를 AI에게 세 번 고쳐 달라고 해서 완성했어요. 두 번째 요청에 '버튼은 하나만'을 넣으니 확 나아졌어요.",
    when: "어제",
    likes: 4,
  },
  {
    who: "클럽장",
    what: "주말 바이브코딩 클럽 · 공지",
    body: "다음 주 회고 모임 장소가 성수 작업실로 정해졌어요. 승인 신청 받고 있어요.",
    when: "2일 전",
    likes: 7,
  },
];

export default function HomeDraft() {
  const next = ACTIVITIES[3];
  const discover = ACTIVITIES.filter((a) => a.slug !== next.slug).slice(0, 4);
  return (
    <>
      <header className={h.hello}>
        <div>
          <p className={h.date}>11월 5일 수요일</p>
          <h1 className={s.h1}>좋은 저녁이에요, 멤버하나님</h1>
          <p className={s.muted}>오늘 할 일이 2개 있고, 이번 주에 모임 하나가 기다리고 있어요.</p>
        </div>
        <Image
          className={h.capy}
          src="/images/workbook/lesson-1-1/capy-turn.png"
          alt=""
          width={88}
          height={160}
        />
      </header>

      <section aria-labelledby="next-h">
        <div className={s.sectionHead}>
          <h2 id="next-h">다음 일정</h2>
          <Link href="#">내 일정 전체</Link>
        </div>
        <article className={h.next}>
          <div className={h.nextCover}>
            <Image src={next.cover} alt="" fill sizes="(min-width: 768px) 420px, 100vw" />
            <span className={s.dayBadge}>{next.day}</span>
          </div>
          <div className={h.nextBody}>
            <span className={s.kindTag} data-kind="gathering">
              모임
            </span>
            <h3>{next.title}</h3>
            <ul className={h.nextFacts}>
              <li>
                <Icon name="calendar" size={16} />
                11월 8일 일요일 오후 7:30 – 9:30
              </li>
              <li>
                <Icon name="pin" size={16} />
                망원동 카페 · 상세 주소는 참가 정보에 있어요
              </li>
              <li>
                <Icon name="users" size={16} />
                <span className={s.faces}>
                  {next.people.map((p) => (
                    <Avatar key={p} name={p} size={22} />
                  ))}
                </span>
                나 포함 {next.joined}명
              </li>
            </ul>
            <div className={h.nextActions}>
              <Link href="/demo/design-platform/activity" className={s.cta}>
                참가 정보 보기
              </Link>
              <button type="button" className={s.ghost}>
                캘린더에 추가
              </button>
            </div>
          </div>
        </article>
      </section>

      <section aria-labelledby="todo-h">
        <div className={s.sectionHead}>
          <h2 id="todo-h">오늘 할 일</h2>
        </div>
        <ul className={h.todos}>
          <li>
            <Link href="#" className={h.todo}>
              <span
                className={h.ring}
                style={{ "--p": "30%" } as React.CSSProperties}
                aria-hidden="true"
              >
                <span>3</span>
              </span>
              <span className={h.todoText}>
                <strong>오늘 인증이 아직이에요</strong>
                <small>2주 매일 하나씩 만들기 · 5일차 · 완주까지 7번</small>
              </span>
              <span className={h.todoGo}>
                인증하기 <Icon name="arrow" size={16} />
              </span>
            </Link>
          </li>
          <li>
            <Link href="#" className={h.todo}>
              <span className={h.todoIcon} aria-hidden="true">
                <Icon name="clock" />
              </span>
              <span className={h.todoText}>
                <strong>워크숍 입금을 기다리고 있어요</strong>
                <small>15,000원 · 내일 오후 5:10까지 · 입금자명 멤버하나</small>
              </span>
              <span className={h.todoGo}>
                계좌 보기 <Icon name="arrow" size={16} />
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="people-h">
        <div className={s.sectionHead}>
          <div>
            <h2 id="people-h">내 사람들</h2>
            <p>내 클럽과 같이 챌린지 중인 사람들의 소식</p>
          </div>
        </div>
        <div className={h.peopleGrid}>
          <Link href="#" className={h.club}>
            <div className={h.clubCover}>
              <Image
                src="/images/platform/mock/cover-retro.jpg"
                alt=""
                fill
                sizes="(min-width: 768px) 360px, 100vw"
              />
            </div>
            <div className={h.clubBody}>
              <span className={s.kindTag} data-kind="club">
                클럽
              </span>
              <strong>주말 바이브코딩 클럽</strong>
              <span className={s.people}>
                <span className={s.faces}>
                  {["클럽장", "클럽운영진", "참가자1", "참가자2"].map((p) => (
                    <Avatar key={p} name={p} size={24} />
                  ))}
                </span>
                6명 · 이번 주 활동 2개
              </span>
            </div>
          </Link>
          <ul className={h.feed}>
            {FEED.map((f) => (
              <li key={f.body}>
                <Avatar name={f.who} size={40} />
                <div>
                  <p className={h.feedMeta}>
                    <strong>{f.who}</strong> · {f.what} · {f.when}
                  </p>
                  <p className={h.feedBody}>{f.body}</p>
                  <span className={h.feedLikes}>
                    <Icon name="heart" size={14} /> {f.likes}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="discover-h">
        <div className={s.sectionHead}>
          <div>
            <h2 id="discover-h">이번 주 새로 열린 것</h2>
            <p>관심사 · AI 도구, 바이브코딩</p>
          </div>
          <Link href="/demo/design-platform/explore">발견으로</Link>
        </div>
        <ul className={s.row}>
          {discover.map((a) => (
            <li key={a.slug}>
              <CoverCard a={a} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
