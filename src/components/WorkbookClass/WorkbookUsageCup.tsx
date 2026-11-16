import { useId } from "react";
import styles from "./WorkbookUsageCup.module.scss";

/**
 * A measuring cup that shows "how much was used" without numbers (1-3 screens 3 and 5).
 * `level` is 0..`max` steps; the fill is an example of the idea, not a measured amount.
 */
export function WorkbookUsageCup({
  level,
  max = 5,
  label,
}: {
  level: number;
  max?: number;
  label: string;
}) {
  const clip = `cup-${useId().replace(/:/g, "")}`;
  const height = 96 * Math.max(0, Math.min(1, level / max));
  return (
    <svg className={styles.cup} viewBox="0 0 120 140" role="img" aria-label={label}>
      <defs>
        <clipPath id={clip}>
          <path d="M22 16h76l-8 108H30z" />
        </clipPath>
      </defs>
      <path d="M22 16h76l-8 108H30z" className={styles.glass} />
      <rect
        x="16"
        y={124 - height}
        width="88"
        height={height}
        className={styles.fill}
        clipPath={`url(#${clip})`}
      />
      {/* 눈금 */}
      {Array.from({ length: max - 1 }, (_, index) => {
        const y = 124 - (96 * (index + 1)) / max;
        return <path key={index} d={`M26 ${y}h14`} className={styles.mark} />;
      })}
      <path d="M22 16h76l-8 108H30z" className={styles.outline} />
      <path d="M98 34h10c8 0 8 34-6 34" className={styles.outline} />
    </svg>
  );
}
