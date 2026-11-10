import Link from "next/link";
import { KindTag } from "@/components/KindTag/KindTag";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import type { ClubCardData } from "@/lib/platform/queries";
import styles from "./ClubCard.module.scss";

/** 클럽 카드. 분홍 태그가 "클럽"을 뜻한다. href가 없으면 링크 없이. badge는 내 상태(멤버·승인 대기). */
export function ClubCard({
  club,
  href,
  badge,
}: {
  club: ClubCardData;
  href?: string;
  badge?: string;
}) {
  const body = (
    <>
      <span className={styles.name}>
        <KindTag kind="club">클럽</KindTag>
        {club.name}
        {badge && <span className={styles.badge}>{badge}</span>}
      </span>
      {club.tagline && <span className={styles.tagline}>{club.tagline}</span>}
      <span className={styles.meta}>
        멤버 {club.members}명 · {club.joinMode === "approval" ? "승인 후 가입" : "바로 가입"}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={styles.card}>
      {body}
      <LinkPending scene="walk" />
    </Link>
  ) : (
    <div className={styles.card}>{body}</div>
  );
}
