import Link from "next/link";
import styles from "./EmptyState.module.scss";

/** 비었을 때 다음 행동을 알려 준다. 행동이 없으면 문장만. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
      {action && (
        <Link href={action.href} className={styles.action}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
