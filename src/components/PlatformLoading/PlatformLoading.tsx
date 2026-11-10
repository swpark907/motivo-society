import { CapyLoading } from "@/components/CapyLoading/CapyLoading";
import styles from "./PlatformLoading.module.scss";

/**
 * 플랫폼 화면을 서버가 그리는 동안 보이는 화면. 누른 뒤 아무 일도 없는 것처럼 보이지 않게 한다.
 * 공용 로딩(물결치는 LOADING + 카피바라 산책 → 차 → 비행기 순환)을 화면 가운데에.
 * notFound()를 부르는 화면(활동·클럽·주문 상세)에는 두지 않는다. 로딩 화면이 있으면 응답이 먼저
 * 시작되어, 없는 주소도 404가 아니라 200으로 나간다.
 */
export function PlatformLoading() {
  return (
    <main data-platform className={`paper ${styles.page}`} aria-busy="true">
      <div className={styles.center}>
        <CapyLoading />
      </div>
    </main>
  );
}
