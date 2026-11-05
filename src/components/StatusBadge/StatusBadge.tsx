import { statusTone } from "@/lib/platform/messages";
import styles from "./StatusBadge.module.scss";

/**
 * 상태 배지. 모양은 상태의 성격으로 정한다 — 진행됐거나 유효함(진한 면) · 기다림(오렌지 선) · 끝남/빠짐(흐린 글자).
 * 색만으로 전하지 않도록 항상 글자를 함께 쓴다.
 */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = statusTone(status);
  return (
    <span className={styles.badge} data-tone={tone}>
      {label ?? status}
    </span>
  );
}
