// 2-2에서 여러 화면이 같이 쓰는 네 칸 메모 한 장(1-5·1-6의 메모와 같은 모양: 노란 메모지 + 검은 이름표).
// 같은 메모는 화면이 바뀌어도 같은 글이어야 하므로(수업 만들기 규칙) 글은 workbook-plan-memo.ts 한 곳에서 만든다.
import type { MemoRow } from "@/lib/workbook-plan-memo";
import styles from "./WorkbookPlanMemoCard.module.scss";

export function WorkbookPlanMemoCard({
  rows,
  label,
  showFrom = false,
  shown = rows.length,
  compact = false,
}: {
  rows: readonly MemoRow[];
  label: string;
  /** 줄마다 2-1의 어느 기획에서 왔는지 작게 붙인다. */
  showFrom?: boolean;
  /** 앞에서부터 몇 줄까지 채워 보여줄지(나머지는 이름표만). */
  shown?: number;
  compact?: boolean;
}) {
  return (
    <section className={styles.memo} data-compact={compact} aria-label={label}>
      <header className={styles.to}>AI에게</header>
      <ol className={styles.rows}>
        {rows.map((row, index) => (
          <li key={row.label} className={styles.row} data-filled={index < shown}>
            <strong className={styles.tag}>{row.label}</strong>
            {index < shown ? (
              <span className={styles.body}>
                <span className={styles.line}>{row.line}</span>
                {showFrom && <small className={styles.from}>← {row.from}</small>}
              </span>
            ) : (
              <span className={styles.empty} aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
