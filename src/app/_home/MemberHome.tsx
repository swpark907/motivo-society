import Image from "next/image";
import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard/ActivityCard";
import { Avatar } from "@/components/Avatar/Avatar";
import { KindTag } from "@/components/KindTag/KindTag";
import { LineIcon } from "@/components/LineIcon/LineIcon";
import { dateOnly } from "@/lib/platform/activity-text";
import { clockTime, dayBadge, gatheringWhen, timeLeftText } from "@/lib/platform/activity-time";
import {
  getMemberHome,
  greeting,
  type MemberHome as Data,
  type Todo,
} from "@/lib/platform/member-home";
import { won } from "@/lib/platform/messages";
import type { CurrentUser } from "@/lib/platform/session";
import s from "./member-home.module.scss";

const TODAY = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "long",
});

/**
 * 회원 홈 — 대시보드가 아니라 위에서 아래로 읽는 하루: 오늘 → 내 사람들 → 발견.
 * 처음 온 회원(일정·할 일·클럽이 없는 사람)은 빈 칸 대신 발견을 먼저 본다.
 */
export async function MemberHome({ user }: { user: CurrentUser }) {
  const now = new Date();
  const data = await getMemberHome(user.id, now);
  const [next, ...later] = data.upcoming;

  return (
    <main className={`paper ${s.page}`}>
      <div className={s.inner}>
        <header className={s.hello}>
          <div>
            <p className={s.date}>{TODAY.format(now)}</p>
            <h1 className={s.title}>
              {greeting(now)}, {user.nickname}님
            </h1>
            <p className={s.sub}>{summaryLine(data)}</p>
          </div>
          <Image
            className={s.capy}
            src="/images/workbook/lesson-1-1/capy-turn.png"
            alt=""
            width={88}
            height={160}
          />
        </header>

        {data.isNewcomer ? (
          <>
            <Discover data={data} now={now} first />
            <Welcome />
          </>
        ) : (
          <>
            {next && <Next item={next} now={now} />}
            {data.todos.length > 0 && <Todos todos={data.todos} now={now} />}
            {later.length > 0 && <Later items={later.slice(0, 3)} now={now} />}
            {(data.clubs.length > 0 || data.feed.length > 0) && <People data={data} />}
            <Discover data={data} now={now} />
          </>
        )}
      </div>
    </main>
  );
}

function summaryLine(d: Data): string {
  if (d.isNewcomer) return "처음 오셨네요. 지금 모집 중인 것부터 둘러보세요.";
  const parts: string[] = [];
  if (d.todos.length) parts.push(`오늘 할 일이 ${d.todos.length}개 있어요`);
  if (d.upcoming.length) parts.push(`다가오는 일정이 ${d.upcoming.length}개예요`);
  return parts.length
    ? `${parts.join(", ")}.`
    : "오늘은 예정된 일정이 없어요. 새로 열린 것을 둘러보세요.";
}

function Next({ item, now }: { item: Data["upcoming"][number]; now: Date }) {
  const start = new Date(item.startsAt);
  const badge = dayBadge(start, now);
  return (
    <section aria-labelledby="next-h">
      <div className={s.sectionHead}>
        <h2 id="next-h">다음 일정</h2>
        <Link href="/me/schedule">내 일정 전체</Link>
      </div>
      <article className={s.next}>
        <div className={s.nextCover} data-kind={item.kind}>
          {item.cover && (
            <Image src={item.cover} alt="" fill sizes="(min-width: 768px) 420px, 100vw" />
          )}
          {badge && <span className={s.dayBadge}>{badge}</span>}
        </div>
        <div className={s.nextBody}>
          <KindTag kind={item.kind} />
          <h3>{item.title}</h3>
          <ul className={s.nextFacts}>
            <li>
              <LineIcon name="calendar" size={16} />
              {gatheringWhen(start, now)}
              {item.endsAt && ` – ${clockTime(new Date(item.endsAt))}`}
            </li>
            {item.place && (
              <li>
                <LineIcon name={item.online ? "video" : "pin"} size={16} />
                {item.place}
                {item.online
                  ? " · 링크는 시작 30분 전에 열려요"
                  : " · 상세 주소는 참가 정보에 있어요"}
              </li>
            )}
          </ul>
          <Link href={`/activities/${item.slug}`} className={s.cta}>
            참가 정보 보기
          </Link>
        </div>
      </article>
    </section>
  );
}

function Todos({ todos, now }: { todos: Todo[]; now: Date }) {
  return (
    <section aria-labelledby="todo-h">
      <div className={s.sectionHead}>
        <h2 id="todo-h">오늘 할 일</h2>
      </div>
      <ul className={s.todos}>
        {todos.map((t) => (
          <li key={`${t.kind}-${t.slug}`}>
            <TodoItem todo={t} now={now} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TodoItem({ todo: t, now }: { todo: Todo; now: Date }) {
  if (t.kind === "payment") {
    return (
      <Link href={`/activities/${t.slug}/apply`} className={s.todo}>
        <span className={s.todoIcon} aria-hidden="true">
          <LineIcon name="clock" />
        </span>
        <span className={s.todoText}>
          <strong>입금을 기다리고 있어요</strong>
          <small>
            {t.title} · {won(t.amount)} ·{" "}
            {timeLeftText(new Date(t.dueAt), now) ?? "기한이 지났어요"}
          </small>
        </span>
        <span className={s.todoGo}>
          입금 안내 <LineIcon name="arrow" size={16} />
        </span>
      </Link>
    );
  }
  if (t.kind === "cert") {
    const left = Math.max(0, t.threshold - t.accepted);
    const pct = t.threshold ? Math.min(100, Math.round((t.accepted / t.threshold) * 100)) : 0;
    return (
      <Link href={`/activities/${t.slug}`} className={s.todo}>
        <span
          className={s.ring}
          style={{ "--p": `${pct}%` } as React.CSSProperties}
          role="img"
          aria-label={`완주 조건 ${t.threshold}번 중 ${t.accepted}번 인증`}
        >
          <span>{t.accepted}</span>
        </span>
        <span className={s.todoText}>
          <strong>오늘 인증이 아직이에요</strong>
          <small>
            {t.title} · {left > 0 ? `완주까지 ${left}번` : "완주 조건을 채웠어요"}
          </small>
        </span>
        <span className={s.todoGo}>
          챌린지 <LineIcon name="arrow" size={16} />
        </span>
      </Link>
    );
  }
  return (
    <Link href={`/activities/${t.slug}/apply`} className={s.todo}>
      <span className={s.todoIcon} aria-hidden="true">
        <LineIcon name="users" />
      </span>
      <span className={s.todoText}>
        <strong>{t.status === "waitlisted" ? "대기 중이에요" : "승인을 기다리고 있어요"}</strong>
        <small>{t.title}</small>
      </span>
      <span className={s.todoGo}>
        신청 내역 <LineIcon name="arrow" size={16} />
      </span>
    </Link>
  );
}

function Later({ items, now }: { items: Data["upcoming"]; now: Date }) {
  return (
    <section aria-labelledby="later-h">
      <div className={s.sectionHead}>
        <h2 id="later-h">그다음 일정</h2>
      </div>
      <ul className={s.later}>
        {items.map((x) => (
          <li key={`${x.slug}-${x.startsAt}`}>
            <Link href={`/activities/${x.slug}`}>
              <KindTag kind={x.kind} />
              <strong>{x.title}</strong>
              <span>{gatheringWhen(new Date(x.startsAt), now)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function People({ data }: { data: Data }) {
  return (
    <section aria-labelledby="people-h">
      <div className={s.sectionHead}>
        <div>
          <h2 id="people-h">내 사람들</h2>
          <p>내 클럽과 같이 챌린지하는 사람들의 소식</p>
        </div>
      </div>
      <div className={s.peopleGrid}>
        {data.clubs.length > 0 && (
          <ul className={s.clubs}>
            {data.clubs.map((c) => (
              <li key={c.slug}>
                <Link href="/clubs" className={s.club}>
                  <KindTag kind="club">클럽</KindTag>
                  <strong>{c.name}</strong>
                  {c.tagline && <span className={s.muted}>{c.tagline}</span>}
                  <span className={s.clubFoot}>
                    <span className={s.faces}>
                      {c.members.map((m) => (
                        <Avatar key={m} name={m} size={24} />
                      ))}
                    </span>
                    {c.memberCount}명 · 모집 중 {c.openActivities}개
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {data.feed.length > 0 && (
          <ul className={s.feed} aria-label="같이 챌린지하는 사람들의 인증">
            {data.feed.map((f) => (
              <li key={f.id}>
                <Avatar name={f.nickname} size={40} />
                <div>
                  <p className={s.feedMeta}>
                    <strong>{f.nickname}</strong> ·{" "}
                    <Link href={`/activities/${f.slug}`}>{f.activityTitle}</Link> ·{" "}
                    {dateOnly(f.certDate)}
                  </p>
                  {f.body && <p className={s.feedBody}>{f.body}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Discover({ data, now, first }: { data: Data; now: Date; first?: boolean }) {
  if (data.discover.length === 0) return null;
  return (
    <section aria-labelledby="discover-h">
      <div className={s.sectionHead}>
        <div>
          <h2 id="discover-h">{first ? "지금 함께할 수 있는 것" : "새로 열린 것"}</h2>
          <p>{first ? "마음에 드는 것 하나에 들어가 보세요" : "아직 신청하지 않은 모집 중 활동"}</p>
        </div>
        <Link href="/explore">발견으로</Link>
      </div>
      <ul className={s.row}>
        {data.discover.map((a) => (
          <li key={a.id}>
            <ActivityCard activity={a} now={now} href={`/activities/${a.slug}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Welcome() {
  return (
    <section className={s.welcome} aria-labelledby="welcome-h">
      <h2 id="welcome-h">모쏘는 이렇게 써요</h2>
      <ol>
        <li>
          <strong>발견</strong>에서 모임·시즌·챌린지를 골라 신청해요.
        </li>
        <li>
          신청한 일정과 할 일이 이 <strong>홈</strong>에 모여요.
        </li>
        <li>
          마음 맞는 사람들과 <strong>클럽</strong>에서 계속 만나요.
        </li>
      </ol>
      <div className={s.welcomeActions}>
        <Link href="/clubs" className={s.ghost}>
          클럽 둘러보기
        </Link>
        <Link href="/learn" className={s.ghost}>
          배우기
        </Link>
      </div>
    </section>
  );
}
