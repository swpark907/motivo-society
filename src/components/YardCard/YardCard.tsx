import Image from "next/image";
import Link from "next/link";
import { YARD_STATUS_LABEL, type YardItem } from "@/lib/content/yard";
import styles from "./YardCard.module.scss";

// 4:5 표지 (인스타 카드뉴스 비율). cover가 없으면 포스터형 타이포 커버.
export function YardCard({ item }: { item: YardItem }) {
  return (
    <Link href={`/yard/${item.slug}`} className={styles.card}>
      <div className={styles.cover}>
        {item.cover ? (
          <Image
            src={item.cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 70vw"
            className={styles.img}
          />
        ) : (
          <div className={styles.poster}>
            <span className={`display ${styles.posterKind}`}>
              {item.kind === "class" ? "Class" : "Meetup"}
            </span>
            <span className={`display ${styles.posterTitle}`}>{item.title}</span>
          </div>
        )}
        <span className={styles.status}>{YARD_STATUS_LABEL[item.status]}</span>
      </div>
      <h3 className={styles.title}>{item.title}</h3>
      {item.tags.length > 0 && (
        <ul className={styles.tags}>
          {item.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </Link>
  );
}
