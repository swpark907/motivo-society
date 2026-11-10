import Link from "next/link";
import type { LIBRARY_CATEGORIES } from "@/lib/content/library";
import styles from "./LibraryCategoryCard.module.scss";

type Category = (typeof LIBRARY_CATEGORIES)[number];

// 16:9 단색 면 위 카테고리명 2줄. 레퍼런스의 그라디언트는 쓰지 않는다.
export function LibraryCategoryCard({ category, count }: { category: Category; count?: number }) {
  return (
    <Link href={`/library#${category.id}`} className={styles.card}>
      <span className={`display ${styles.title}`}>
        {category.title.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
      <span className={styles.meta}>
        <span className="label">{category.label}</span>
        {/* 0을 숫자로 내세우지 않는다(정직함). 비어 있으면 준비 중이라고만 쓴다. */}
        {typeof count === "number" && (
          <span className={styles.count}>{count > 0 ? `${count}편` : "준비 중"}</span>
        )}
      </span>
    </Link>
  );
}
