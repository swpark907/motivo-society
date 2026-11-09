import { Avatar } from "@/components/Avatar/Avatar";
import { dateOnly } from "@/lib/platform/activity-text";
import { finishProgress } from "@/lib/platform/challenge-days";
import type { ChallengeRoom as Room } from "@/lib/platform/challenge-room";
import { CertForm } from "./CertForm";
import s from "./challenge.module.scss";

const DAY_LABELS: Record<string, string> = {
  done: "인증함",
  rejected: "반려됨",
  missed: "빠짐",
  today: "오늘",
  rest: "",
};

/** 확정 참가자에게만 보이는 참여 영역: 오늘 미션 → 오늘 인증 → 내 진행 → 함께한 기록. */
export function ChallengeRoom({
  room,
  activityId,
  slug,
  startsOn,
}: {
  room: Room;
  activityId: string;
  slug: string;
  startsOn: string;
}) {
  const { left, pct } = finishProgress(room.accepted, room.threshold);
  const allowText = room.formats.includes("text");
  const allowLink = room.formats.includes("link");

  return (
    <section className={s.room} aria-labelledby="room-h" id="today">
      <div className={s.roomHead}>
        <h2 id="room-h">내 챌린지</h2>
        <span>
          {room.phase === "during"
            ? `${room.dayNo}일째 · ${room.totalDays}일 중`
            : room.phase === "before"
              ? `${dateOnly(startsOn)}에 시작해요`
              : "기간이 끝났어요"}
        </span>
      </div>

      <div className={s.roomGrid}>
        <div className={s.todayCol}>
          {room.phase === "during" && (
            <div className={s.mission}>
              <p className={s.missionLabel}>오늘의 미션</p>
              {room.mission ? (
                <>
                  <strong>{room.mission.title}</strong>
                  {room.mission.body && <p>{room.mission.body}</p>}
                </>
              ) : (
                <strong>오늘은 정해진 미션이 없어요. 하고 싶은 것을 해요.</strong>
              )}
            </div>
          )}

          <section className={s.cert} aria-labelledby="cert-h">
            <h3 id="cert-h">오늘 인증</h3>
            {room.phase === "before" && (
              <p className={s.muted}>시작하는 날부터 인증을 올릴 수 있어요.</p>
            )}
            {room.phase === "after" && (
              <p className={s.muted}>기간이 끝나 더 올릴 수 없어요. 아래에서 기록을 돌아봐요.</p>
            )}
            {room.phase === "during" &&
              (room.todayCert?.status === "rejected" ? (
                <div className={s.rejected} role="status">
                  <strong>오늘 인증이 반려됐어요</strong>
                  <p>사유: {room.todayCert.rejectedReason ?? "적힌 사유가 없어요"}</p>
                  <p className={s.hint}>
                    반려된 날은 다시 올릴 수 없어요. 진행자에게 문의해 주세요.
                  </p>
                </div>
              ) : allowText || allowLink ? (
                <CertForm
                  activityId={activityId}
                  slug={slug}
                  allowText={allowText}
                  allowLink={allowLink}
                  current={
                    room.todayCert ? { body: room.todayCert.body, link: room.todayCert.link } : null
                  }
                />
              ) : (
                <p className={s.muted}>사진 인증은 아직 올릴 수 없어요. 준비하고 있어요.</p>
              ))}
            {room.phase === "during" &&
              room.formats.includes("photo") &&
              (allowText || allowLink) && (
                <p className={s.hint}>사진 인증은 준비 중이에요. 지금은 글이나 링크로 올려요.</p>
              )}
          </section>
        </div>

        <section className={s.progress} aria-labelledby="progress-h">
          <h3 id="progress-h">내 진행</h3>
          <div className={s.progressTop}>
            <span
              className={s.ring}
              style={{ "--p": `${pct}%` } as React.CSSProperties}
              role="img"
              aria-label={`완주 조건 ${room.threshold}번 중 ${room.accepted}번 인증`}
            >
              <span>
                <strong>{room.accepted}</strong>/{room.threshold}
              </span>
            </span>
            <p>
              <strong>{left > 0 ? `완주까지 ${left}번` : "완주 조건을 채웠어요"}</strong>
              <small>{room.threshold}번 인증하면 완주예요.</small>
            </p>
          </div>
          <ol className={s.days} aria-label="날짜별 내 인증">
            {room.days.map((d) => (
              <li
                key={d.date}
                data-state={d.state}
                title={`${d.no}일째${DAY_LABELS[d.state] ? ` · ${DAY_LABELS[d.state]}` : ""}`}
              >
                <span aria-hidden="true">{d.no}</span>
                <span className={s.srOnly}>
                  {d.no}일째{DAY_LABELS[d.state] ? ` ${DAY_LABELS[d.state]}` : ""}
                </span>
              </li>
            ))}
          </ol>
          <ul className={s.legend} aria-hidden="true">
            <li data-state="done">인증함</li>
            {room.rule === "daily" && <li data-state="missed">빠짐</li>}
            <li data-state="rejected">반려됨</li>
          </ul>
        </section>
      </div>

      <section className={s.together} aria-labelledby="together-h">
        <h3 id="together-h">함께한 기록</h3>
        {!room.certsVisible && (
          <p className={s.hint}>이 챌린지는 인증 글을 여는 사람만 봐요. 횟수만 함께 보여요.</p>
        )}
        <ul className={s.people}>
          {room.companions.map((c) => (
            <li key={c.userId}>
              <Avatar name={c.nickname} size={40} />
              <div>
                <p className={s.personMeta}>
                  <strong>{c.isMe ? `${c.nickname} (나)` : c.nickname}</strong> · 인증 {c.accepted}
                  번{c.latest && ` · ${c.latest.dayNo}일째`}
                </p>
                {c.latest && (c.isMe || room.certsVisible) ? (
                  <>
                    {c.latest.body && <p className={s.personBody}>{c.latest.body}</p>}
                    {c.latest.link && (
                      <a
                        href={c.latest.link}
                        target="_blank"
                        rel="noreferrer"
                        className={s.certLink}
                      >
                        {c.latest.link}
                      </a>
                    )}
                  </>
                ) : (
                  c.accepted === 0 && <p className={s.muted}>아직 인증 전이에요.</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
