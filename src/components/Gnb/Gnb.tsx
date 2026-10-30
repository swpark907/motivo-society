import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { TestPageMenu } from "./TestPageMenu";
import { NavLink } from "./NavLink";
import styles from "./Gnb.module.scss";

export function Gnb() {
  return (
    <header className={styles.header}>
      <nav
        className={styles.nav}
        aria-label="주 메뉴"
        data-test-navigation={process.env.NODE_ENV !== "production"}
      >
        <Link href="/" className={`display ${styles.brand}`}>
          Motivo Society
        </Link>
        <ul className={styles.menu}>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <NavLink href={item.href} className={styles.link}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        {process.env.NODE_ENV !== "production" && <TestPageMenu />}
      </nav>
    </header>
  );
}
