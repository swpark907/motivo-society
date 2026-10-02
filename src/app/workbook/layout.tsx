import Link from "next/link";
import { Rail } from "@/components/Rail/Rail";
import styles from "./layout.module.scss";

export default function WorkbookLayout({ children }: LayoutProps<"/workbook">) {
  return (
    <div className={styles.shell}>
      <Rail label="Workbook 메뉴">
        <Link href="/demo/coloring-book">비밀 정원 · 컬러링 데모 ↗</Link>
        <p className={styles.railNote}>상세 메뉴는 커리큘럼 확정 후 채웁니다.</p>
      </Rail>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
