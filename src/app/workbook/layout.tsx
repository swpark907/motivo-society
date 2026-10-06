"use client";

// 워크북 메뉴의 펼침 상태를 탐색 중 유지한다.
import { WorkbookNavigationContext } from "@/components/WorkbookClass/WorkbookNavigationContext";
import { useCallback, useState } from "react";
import Link from "next/link";
import styles from "./layout.module.scss";

export default function WorkbookLayout({ children }: LayoutProps<"/workbook">) {
  const [collapsed, setCollapsed] = useState(false);
  const prepareLesson = useCallback(() => {
    setCollapsed(true);
  }, []);
  return (
    <div className={styles.shell} data-collapsed={collapsed}>
      <aside className={styles.rail}>
        <button
          className={styles.railToggle}
          aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          aria-expanded={!collapsed}
          aria-controls="workbook-navigation"
          onClick={() => setCollapsed(!collapsed)}
        >
          {/* Lucide PanelLeft · ISC, docs/licenses/lucide.txt */}
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
        <div id="workbook-navigation" className={styles.railBody} hidden={collapsed}>
          <Link href="/workbook" className={styles.brand}>
            MY WORKBOOK<span>PLAY. LEARN. GROW.</span>
          </Link>
          <nav aria-label="Workbook 메뉴">
            <Link href="/workbook">
              클래스 둘러보기 <span>↗</span>
            </Link>
            <Link href="/workbook#reading">
              읽을거리 <span>↗</span>
            </Link>
            <a href="/workbook#experiments">
              짧은 실험 <span>↗</span>
            </a>
            <Link href="/library">
              라이브러리 <span>↗</span>
            </Link>
            <Link href="/demo/coloring-book">
              비밀 정원 · 컬러링 데모 <span>↗</span>
            </Link>
          </nav>
          <div className={styles.note}>
            <span className="label">A LITTLE, EVERY DAY</span>
            <p>
              서두르지 않아도,
              <br />
              조금씩 내 것으로.
            </p>
            <span>
              Same Capybara,
              <br />
              Bigger You.
            </span>
          </div>
          <p className={styles.preview}>WORKBOOK / CREATIVE CLUB</p>
        </div>
      </aside>
      <div className={styles.content}>
        <WorkbookNavigationContext.Provider value={prepareLesson}>
          {children}
        </WorkbookNavigationContext.Provider>
      </div>
    </div>
  );
}
