import Image from "next/image";
import Link from "next/link";
import { KindTag } from "@/components/KindTag/KindTag";
import { LineIcon } from "@/components/LineIcon/LineIcon";
import { dayBadge, gatheringWhen, periodWhen } from "@/lib/platform/activity-time";
import { won } from "@/lib/platform/messages";
import type { ActivityCardData } from "@/lib/platform/queries";
import styles from "./ActivityCard.module.scss";

/** 남은 자리. 정원이 없으면(챌린지 등) null. */
export function seatsText(a: ActivityCardData): string | null {
  if (a.capacity === null) return null;
  const left = a.capacity - a.taken;
  return left > 0 ? `${left}자리 남음` : "대기 신청 가능";
}

/** 언제: 모임은 날짜·시각, 시즌은 회차, 챌린지는 기간. */
export function whenText(a: ActivityCardData, now: Date): string {
  if (!a.startsAt) return "일정 미정";
  const start = new Date(a.startsAt);
  if (a.kind === "series" && a.sessions) {
    const count = `${a.sessions.count}회`;
    if (a.status === "in_progress" && a.sessions.nextAt) {
      return `다음 회차 ${gatheringWhen(new Date(a.sessions.nextAt), now)} · ${count}`;
    }
    return `${gatheringWhen(start, now)} 시작 · ${count}`;
  }
  if (a.kind === "challenge") return periodWhen(start, a.endsAt ? new Date(a.endsAt) : null);
  return gatheringWhen(start, now);
}

function badgeText(a: ActivityCardData, now: Date): { text: string; live: boolean } | null {
  if (a.status === "in_progress") return { text: "진행 중 · 합류 가능", live: true };
  if (!a.startsAt) return null;
  const text = dayBadge(new Date(a.startsAt), now);
  return text ? { text, live: false } : null;
}

/**
 * 활동 카드: 표지 → 언제 → 제목 → 장소·주최 → 남은 자리·가격.
 * 기준 시안 docs/design-references/platform/service-draft-l01b.md.
 * href가 없으면 링크 없이 보여 준다(상세 화면이 아직 없는 동안).
 */
export function ActivityCard({
  activity: a,
  now,
  href,
}: {
  activity: ActivityCardData;
  now: Date;
  href?: string;
}) {
  const seats = seatsText(a);
  const badge = badgeText(a, now);
  const urgent = a.capacity !== null && a.capacity - a.taken > 0 && a.capacity - a.taken <= 2;
  const place = a.online ? "온라인" : (a.area ?? "장소 미정");

  const body = (
    <>
      <div className={styles.cover} data-kind={a.kind}>
        {a.cover ? (
          <Image
            src={a.cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 80vw"
          />
        ) : (
          <span className={styles.fallback} aria-hidden="true">
            {a.title}
          </span>
        )}
        <div className={styles.coverTop}>
          <KindTag kind={a.kind} />
          {badge && <span className={badge.live ? styles.live : styles.day}>{badge.text}</span>}
        </div>
      </div>
      <div className={styles.body}>
        <p className={styles.when}>{whenText(a, now)}</p>
        <h3 className={styles.title}>{a.title}</h3>
        <p className={styles.meta}>
          <span>
            <LineIcon name={a.online ? "video" : "pin"} size={14} />
            {place}
          </span>
          {a.host && <span>{a.host}</span>}
        </p>
        <p className={styles.foot}>
          <span className={urgent ? styles.urgent : undefined}>{seats ?? "누구나 참여"}</span>
          <span className={styles.price}>{a.price > 0 ? won(a.price) : "무료"}</span>
        </p>
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={styles.card}>
      {body}
    </Link>
  ) : (
    <article className={styles.card}>{body}</article>
  );
}
