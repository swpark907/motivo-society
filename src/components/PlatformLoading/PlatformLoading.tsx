import styles from "./PlatformLoading.module.scss";

/**
 * 플랫폼 화면을 서버가 그리는 동안 보이는 자리. 누른 뒤 아무 일도 없는 것처럼 보이지 않게 한다.
 * 움직임 없이 회색 면만(AGENTS 모션 규칙). 스크린 리더에는 한 줄로 알린다.
 * notFound()를 부르는 화면(활동·클럽·주문 상세)에는 두지 않는다. 로딩 화면이 있으면 응답이 먼저
 * 시작되어, 없는 주소도 404가 아니라 200으로 나간다.
 */
export function PlatformLoading() {
  return (
    <main className={`paper ${styles.page}`} aria-busy="true">
      <div className={styles.inner}>
        <p className={styles.text} role="status">
          불러오는 중이에요
        </p>
        <span className={styles.title} aria-hidden="true" />
        <span className={styles.line} aria-hidden="true" />
        <div className={styles.cards} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}
