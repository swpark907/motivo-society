import Link from "next/link";
import {
  barShape,
  kstDateKey,
  monthGrid,
  rowsOnDay,
  shiftMonth,
  type ScheduleRow,
} from "@/lib/platform/schedule";
import { clockTime } from "@/lib/platform/activity-time";
import s from "./schedule.module.scss";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function monthHref(month: string, day?: string): string {
  return `/me/schedule?view=month&month=${month}${day ? `&day=${day}` : ""}`;
}

/** 월 달력. 날짜 칸은 그날의 일정을 아래에 펼치는 링크다. 챌린지는 기간 막대로 이어진다. */
export function MonthCalendar({
  month,
  selected,
  rows,
  now,
}: {
  month: string;
  selected: string | null;
  rows: ScheduleRow[];
  now: Date;
}) {
  const [y, m] = month.split("-").map(Number);
  const today = kstDateKey(now);

  return (
    <section className={s.calendar} aria-label={`${y}년 ${m}월 달력`}>
      <div className={s.monthHead}>
        <Link href={monthHref(shiftMonth(month, -1))} className={s.monthNav} aria-label="이전 달">
          ‹
        </Link>
        <h2>
          {y}년 {m}월
        </h2>
        <Link href={monthHref(shiftMonth(month, 1))} className={s.monthNav} aria-label="다음 달">
          ›
        </Link>
        {month !== today.slice(0, 7) && (
          <Link href={monthHref(today.slice(0, 7), today)} className={s.todayLink}>
            오늘
          </Link>
        )}
      </div>

      <div className={s.grid}>
        <div className={s.week}>
          {WEEKDAYS.map((w) => (
            <span key={w} className={s.weekday} aria-hidden="true">
              {w}
            </span>
          ))}
        </div>
        {monthGrid(month).map((week) => (
          <div key={week[0]} className={s.week}>
            {week.map((day) => {
              const items = rowsOnDay(rows, day);
              const bars = items.filter((r) => r.kind === "challenge");
              const dots = items.filter((r) => r.kind !== "challenge");
              const label = `${Number(day.slice(5, 7))}월 ${Number(day.slice(8))}일${
                items.length ? `, 일정 ${items.length}개` : ""
              }`;
              return (
                <Link
                  key={day}
                  href={monthHref(month, day)}
                  className={s.cell}
                  data-outside={!day.startsWith(month) || undefined}
                  data-today={day === today || undefined}
                  aria-current={day === selected ? "date" : undefined}
                  aria-label={label}
                >
                  <span className={s.date}>{Number(day.slice(8))}</span>
                  {bars.map((r) => (
                    <span
                      key={r.key}
                      className={s.span}
                      data-kind={r.kind}
                      data-shape={barShape(r, day)}
                      title={r.title}
                    >
                      {(barShape(r, day) === "start" || day.endsWith("-01") || isMonday(day)) && (
                        <em>{r.title}</em>
                      )}
                    </span>
                  ))}
                  {dots.map((r) => (
                    <span key={r.key} className={s.chip} data-kind={r.kind} title={r.title}>
                      <em>
                        {clockTime(new Date(r.startsAt))} {r.title}
                      </em>
                    </span>
                  ))}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function isMonday(day: string): boolean {
  return new Date(`${day}T00:00:00Z`).getUTCDay() === 1;
}
