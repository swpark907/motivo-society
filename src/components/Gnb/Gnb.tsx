import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { NavLink } from "./NavLink";
import styles from "./Gnb.module.scss";

export function Gnb() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="주 메뉴">
        <Link href="/" className={styles.brand}>
          motivo society
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
      </nav>
    </header>
  );
}
