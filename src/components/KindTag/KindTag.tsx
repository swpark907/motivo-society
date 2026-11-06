import { KIND_LABELS } from "@/lib/platform/messages";
import styles from "./KindTag.module.scss";

/** 활동 종류 표시. 플랫폼 화면에서 파스텔 색은 이 태그(와 기본 표지)에만 쓴다. */
export function KindTag({ kind, children }: { kind: string; children?: React.ReactNode }) {
  return (
    <span className={styles.tag} data-kind={kind}>
      {children ?? KIND_LABELS[kind] ?? kind}
    </span>
  );
}
