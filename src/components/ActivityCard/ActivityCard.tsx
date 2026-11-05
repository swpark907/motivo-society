import Link from "next/link";
import type { ActivityCardData } from "@/lib/platform/queries";
import { KIND_LABELS, won } from "@/lib/platform/messages";
import styles from "./ActivityCard.module.scss";

const WHEN = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function seatsText(a: ActivityCardData): string | null {
  if (a.capacity === null) return null;
  const left = a.capacity - a.taken;
  return left > 0 ? `${left}자리 남음` : "대기 신청 가능";
}

/**
 * 활동 카드. 바탕색은 활동 종류(모임·시즌·챌린지)를 뜻한다.
 * href가 없으면 링크 없이 보여 준다(상세 화면이 아직 없는 동안).
 */
export function ActivityCard({ activity: a, href }: { activity: ActivityCardData; href?: string }) {
  const body = (
    <>
      <span className={styles.kind}>
        {KIND_LABELS[a.kind]}
        {a.status === "in_progress" && " · 중간에 합류할 수 있어요"}
      </span>
      <span className={styles.title}>{a.title}</span>
      {a.summary && <span className={styles.summary}>{a.summary}</span>}
      <span className={styles.meta}>
        {a.status === "in_progress"
          ? "지금 진행 중"
          : a.startsAt
            ? WHEN.format(new Date(a.startsAt))
            : "일정 미정"}
        {a.online ? " · 온라인" : a.area ? ` · ${a.area}` : ""}
      </span>
      <span className={styles.foot}>
        <span>{a.host}</span>
        <span>
          {a.price > 0 ? won(a.price) : "무료"}
          {seatsText(a) && ` · ${seatsText(a)}`}
        </span>
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={styles.card} data-kind={a.kind}>
      {body}
    </Link>
  ) : (
    <div className={styles.card} data-kind={a.kind}>
      {body}
    </div>
  );
}
