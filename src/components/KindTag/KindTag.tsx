import { KIND_LABELS } from "@/lib/platform/messages";
import styles from "./KindTag.module.scss";

/** 활동 종류 표시. 작업 노트의 검은 도장(종류는 색이 아니라 글자로 구분한다). */
export function KindTag({ kind, children }: { kind: string; children?: React.ReactNode }) {
  return (
    <span className={styles.tag} data-kind={kind}>
      {children ?? KIND_LABELS[kind] ?? kind}
    </span>
  );
}
