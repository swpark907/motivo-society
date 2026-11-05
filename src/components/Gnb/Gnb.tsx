import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { NavLink } from "./NavLink";
import { TabBar } from "./TabBar";
import { TestPageMenu } from "./TestPageMenu";
import styles from "./Gnb.module.scss";

/**
 * 전 페이지 공통 GNB. 넓은 화면은 상단에 다섯 메뉴, 좁은 화면은 상단 로고 + 하단 탭 바.
 * 메뉴 정의는 src/lib/nav.ts, 근거는 docs/product/platform-ia.md.
 */
export function Gnb() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar} data-test-navigation={process.env.NODE_ENV !== "production"}>
          <Link href="/" className={`display ${styles.brand}`}>
            Motivo Society
          </Link>
          <nav className={styles.nav} aria-label="주 메뉴">
            <ul className={styles.menu}>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} className={styles.link}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.account}>
            {process.env.NODE_ENV !== "production" && <TestPageMenu />}
          </div>
        </div>
      </header>
      <TabBar />
    </>
  );
}
