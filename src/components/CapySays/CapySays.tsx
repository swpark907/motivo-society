import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./CapySays.module.scss";

/**
 * 카피바라 말풍선(작업 노트, 2026-11-13). 화면마다 한 번, 감정이 생기는 자리에만 쓴다.
 * 말은 그 화면의 실제 규칙·상태만 담는다(없는 기능·약속을 말하지 않는다).
 */
export function CapySays({ children }: { children: ReactNode }) {
  return (
    <div className={styles.capy}>
      <Image
        src="/images/workbook/lesson-1-1/capy-turn.png"
        alt=""
        width={236}
        height={435}
        className={styles.img}
      />
      <p className={styles.bubble}>{children}</p>
    </div>
  );
}
