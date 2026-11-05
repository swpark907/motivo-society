"use client";
// 클라이언트인 이유: 현재 경로로 활성 탭을 표시하고, 자체 하단 이동이 있는 화면에서는 탭 바를 숨긴다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentNav, hidesTabBar, NAV_ITEMS } from "@/lib/nav";
import { NavIcon } from "./NavIcon";
import styles from "./Gnb.module.scss";

/** 좁은 화면의 하단 탭 바. 넓은 화면에서는 상단 GNB가 같은 메뉴를 보여 준다. */
export function TabBar() {
  const pathname = usePathname();
  if (hidesTabBar(pathname)) return null;
  const current = currentNav(pathname);
  return (
    <>
      <nav className={styles.tabBar} aria-label="하단 메뉴" data-tab-bar>
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.tab}
                aria-current={current === item.href ? "page" : undefined}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
