// 단원을 마치고 다음 단원 지도에 막 도착했을 때 패널 맨 위에 한 번 보이는 줄(1→2단원, 2→3단원 공통).
import { workbookCourse } from "@/lib/workbook-course";
import styles from "./WorkbookMap.module.scss";

export function WorkbookUnitArrival({ finished, next }: { finished: number; next: string }) {
  return (
    <p className={styles.arrival}>
      <strong>{workbookCourse[finished - 1].number}단원을 마쳤어요.</strong> {next}
    </p>
  );
}
