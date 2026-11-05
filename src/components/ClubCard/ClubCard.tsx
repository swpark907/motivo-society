import Link from "next/link";
import type { ClubCardData } from "@/lib/platform/queries";
import styles from "./ClubCard.module.scss";

/** 클럽 카드. 분홍 태그가 "클럽"을 뜻한다. href가 없으면 링크 없이. */
export function ClubCard({ club, href }: { club: ClubCardData; href?: string }) {
  const body = (
    <>
      <span className={styles.name}>
        <span className={styles.tag}>클럽</span>
        {club.name}
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
    </Link>
  ) : (
    <div className={styles.card}>{body}</div>
  );
}
