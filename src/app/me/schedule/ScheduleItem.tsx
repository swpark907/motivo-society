import Link from "next/link";
import { KindTag } from "@/components/KindTag/KindTag";
import { LineIcon } from "@/components/LineIcon/LineIcon";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { clockTime, gatheringWhen, periodWhen, shortDate } from "@/lib/platform/activity-time";
import { PARTICIPATION_LABELS } from "@/lib/platform/messages";
import { challengeDay, videoState, type ScheduleRow } from "@/lib/platform/schedule";
import s from "./schedule.module.scss";

/** 일정 한 줄. 제목이 상세로 가는 링크이고, 화상 링크는 따로 누른다(링크 안에 링크를 두지 않는다). */
export function ScheduleItem({
  row,
  now,
  videoUrl,
  past = false,
}: {
  row: ScheduleRow;
  now: Date;
  videoUrl?: string;
  past?: boolean;
}) {
  const start = new Date(row.startsAt);
  const isChallenge = row.kind === "challenge";

  return (
    <li className={s.item} data-kind={row.kind}>
      <div className={s.when}>
        {past ? (
          <strong>{shortDate(start)}</strong>
        ) : isChallenge ? (
          <strong>기간</strong>
        ) : (
          <strong>{clockTime(start)}</strong>
        )}
        {!isChallenge && row.endsAt && !past && <span>– {clockTime(new Date(row.endsAt))}</span>}
      </div>

      <div className={s.body}>
        <div className={s.tags}>
          <KindTag kind={row.kind} />
          {row.status !== "confirmed" && (
            <StatusBadge status={row.status} label={PARTICIPATION_LABELS[row.status]} />
          )}
          {past && <PastResult row={row} />}
        </div>
        <Link href={`/activities/${row.slug}`} className={s.title}>
          {row.title}
        </Link>
        <p className={s.meta}>
          {[
            row.sub,
            isChallenge ? periodWhen(start, row.endsAt ? new Date(row.endsAt) : null) : row.place,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {isChallenge && !past && <ChallengeBar row={row} now={now} />}
        {!past && <Video row={row} now={now} url={videoUrl} />}
      </div>
    </li>
  );
}

function ChallengeBar({ row, now }: { row: ScheduleRow; now: Date }) {
  const { day, total } = challengeDay(row, now);
  const pct = Math.round((day / total) * 100);
  const c = row.challenge;
  return (
    <div className={s.bar}>
      <span
        className={s.track}
        role="img"
        aria-label={day === 0 ? `${total}일 중 아직 시작 전` : `${total}일 중 ${day}일째`}
      >
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className={s.barText}>
        {day === 0 ? `${total}일 · 시작 전` : `${day}일째 · ${total}일 중`}
        {c && c.threshold > 0 && ` · 인증 ${c.accepted}/${c.threshold}`}
      </span>
    </div>
  );
}

function Video({ row, now, url }: { row: ScheduleRow; now: Date; url?: string }) {
  const state = videoState(row, now);
  if (!state) return null;
  if (state.kind === "open" && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={s.video}>
        <LineIcon name="video" size={16} /> 화상 모임 들어가기
      </a>
    );
  }
  if (state.kind === "later") {
    return (
      <p className={s.videoLater}>
        <LineIcon name="video" size={16} /> 화상 링크는 {gatheringWhen(state.opensAt, now)}에 열려요
      </p>
    );
  }
  return null;
}

function PastResult({ row }: { row: ScheduleRow }) {
  if (row.kind === "challenge" && row.challenge) {
    const c = row.challenge;
    const done = c.outcome === "completed" || (c.threshold > 0 && c.accepted >= c.threshold);
    return <span className={s.result}>{done ? "완주" : `인증 ${c.accepted}번`}</span>;
  }
  if (row.attendance === "attended") return <span className={s.result}>출석</span>;
  if (row.attendance === "absent") return <span className={s.resultOff}>불참</span>;
  return null;
}
