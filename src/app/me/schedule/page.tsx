import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { shortDate } from "@/lib/platform/activity-time";
import { getMySchedule } from "@/lib/platform/my-schedule";
import {
  groupByDay,
  groupByMonth,
  kstDateKey,
  parseDay,
  parseMonth,
  rowsOnDay,
  splitSchedule,
} from "@/lib/platform/schedule";
import { requireUser } from "@/lib/platform/session";
import { MonthCalendar } from "./MonthCalendar";
import { ScheduleItem } from "./ScheduleItem";
import s from "./schedule.module.scss";

export const metadata: Metadata = {
  title: "내 일정",
  description: "신청한 모임·시즌 회차·챌린지를 날짜순으로.",
  robots: { index: false },
};

type View = "upcoming" | "past" | "month";

const TABS: { view: View; label: string; href: string }[] = [
  { view: "upcoming", label: "다가오는", href: "/me/schedule" },
  { view: "past", label: "지난", href: "/me/schedule?view=past" },
  { view: "month", label: "달력", href: "/me/schedule?view=month" },
];

export default async function SchedulePage({ searchParams }: PageProps<"/me/schedule">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const view: View =
    one(sp.view) === "past" ? "past" : one(sp.view) === "month" ? "month" : "upcoming";
  const user = await requireUser(
    view === "upcoming" ? "/me/schedule" : `/me/schedule?view=${view}`,
  );

  const now = new Date();
  const { rows, videoUrls } = await getMySchedule(user.id, now);
  const { upcoming, past } = splitSchedule(rows, now);

  return (
    <PlatformPage
      label="MY SCHEDULE"
      title="내 일정"
      lead="신청한 모임, 시즌 회차, 챌린지가 날짜순으로 모여요."
    >
      <nav className={s.tabs} aria-label="일정 보기">
        {TABS.map((t) => (
          <Link key={t.view} href={t.href} aria-current={t.view === view ? "page" : undefined}>
            {t.label}
            {t.view === "upcoming" && upcoming.length > 0 && <span>{upcoming.length}</span>}
          </Link>
        ))}
      </nav>

      {view === "upcoming" &&
        (upcoming.length ? (
          <div className={s.groups}>
            {groupByDay(upcoming, now).map((g) => (
              <section key={g.key} aria-labelledby={`d-${g.key}`}>
                <h2 id={`d-${g.key}`} className={s.groupHead}>
                  {g.label}
                </h2>
                <ul className={s.list}>
                  {g.rows.map((r) => (
                    <ScheduleItem
                      key={r.key}
                      row={r}
                      now={now}
                      videoUrl={videoUrls.get(r.activityId)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 잡힌 일정이 없어요"
            body="모임·시즌·챌린지를 신청하면 여기에 날짜순으로 모여요."
            action={{ href: "/explore", label: "발견에서 찾아보기" }}
          />
        ))}

      {view === "past" &&
        (past.length ? (
          <div className={s.groups}>
            {groupByMonth(past).map((g) => (
              <section key={g.key} aria-labelledby={`m-${g.key}`}>
                <h2 id={`m-${g.key}`} className={s.groupHead}>
                  {g.label}
                </h2>
                <ul className={s.list}>
                  {g.rows.map((r) => (
                    <ScheduleItem key={r.key} row={r} now={now} past />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="지난 활동이 여기에 쌓여요"
            body="참여를 마친 모임과 챌린지를 다시 볼 수 있어요."
          />
        ))}

      {view === "month" && (
        <MonthView
          rows={[...past, ...upcoming]}
          month={parseMonth(one(sp.month), now)}
          day={one(sp.day)}
          now={now}
          videoUrls={videoUrls}
        />
      )}
    </PlatformPage>
  );
}

function MonthView({
  rows,
  month,
  day,
  now,
  videoUrls,
}: {
  rows: ReturnType<typeof splitSchedule>["upcoming"];
  month: string;
  day: string | undefined;
  now: Date;
  videoUrls: Map<string, string>;
}) {
  const today = kstDateKey(now);
  const selected = parseDay(day, month) ?? (today.startsWith(month) ? today : null);
  const dayRows = selected ? rowsOnDay(rows, selected) : [];
  const endedBefore = (r: (typeof rows)[number]) =>
    new Date(r.endsAt ?? r.startsAt).getTime() <= now.getTime();

  return (
    <>
      <MonthCalendar month={month} selected={selected} rows={rows} now={now} />
      {selected && (
        <section aria-labelledby="day-h">
          <h2 id="day-h" className={s.groupHead}>
            {shortDate(new Date(`${selected}T00:00:00+09:00`))}
            {selected === today && " · 오늘"}
          </h2>
          {dayRows.length ? (
            <ul className={s.list}>
              {dayRows.map((r) => (
                <ScheduleItem
                  key={r.key}
                  row={r}
                  now={now}
                  past={endedBefore(r)}
                  videoUrl={videoUrls.get(r.activityId)}
                />
              ))}
            </ul>
          ) : (
            <p className={s.none}>이날은 일정이 없어요.</p>
          )}
        </section>
      )}
    </>
  );
}
