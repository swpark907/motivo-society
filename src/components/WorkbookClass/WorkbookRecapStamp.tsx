// 정리 화면의 물건 위에 한 번 쾅 찍히는 먹색 도장(2-4 "기획 완료", 2-6 "2단원 완료").
// 오렌지가 아니라 먹색이다(그 화면의 오렌지는 페이지 버튼이나 다음 단원 표가 쓴다). 모션 줄이기에서는 찍힌 채로 보인다.
import styles from "./WorkbookRecapStamp.module.scss";

export function WorkbookRecapStamp({ label }: { label: string }) {
  return (
    <span className={styles.stamp} aria-hidden="true">
      {label}
    </span>
  );
}
