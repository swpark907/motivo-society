"use client";

// 워크북 메뉴의 펼침 상태를 탐색 중 유지한다.
import { WorkbookNavigationContext } from "@/components/WorkbookClass/WorkbookNavigationContext";
import { WorkbookProgressProvider } from "@/components/WorkbookClass/WorkbookProgressContext";
import { useCallback, useState } from "react";
import Link from "next/link";
import { WorkbookCommentsProvider } from "@/components/WorkbookReading/WorkbookComments";
import styles from "./layout.module.scss";

const menuItems = [
  {
    href: "/workbook",
    label: "워크북 홈",
    description: "워크북의 새로운 소식과 콘텐츠",
    icon: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
  },
  {
    href: "/workbook/classes",
    label: "클래스 둘러보기",
    description: "함께 배우고 만드는 클래스",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m10 8 5 4-5 4z" />
      </>
    ),
  },
  {
    href: "/workbook#reading",
    label: "읽을거리",
    description: "천천히 읽고 생각하는 이야기",
    icon: (
      <>
        <path d="M12 6c-2-2-5-2-9-1v14c4-1 7-1 9 1 2-2 5-2 9-1V5c-4-1-7-1-9 1Z" />
        <path d="M12 6v14" />
      </>
    ),
  },
  {
    href: "/workbook#experiments",
    label: "짧은 실험",
    description: "가볍게 직접 해보는 실험",
    icon: (
      <>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8" />
      </>
    ),
  },
  {
    href: "/library",
    label: "라이브러리",
    description: "유용한 기술 자료 모음",
    icon: (
      <>
        <path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3-1 3 15-3 1z" />
      </>
    ),
  },
  {
    href: "/demo/coloring-book",
    label: "비밀 정원 · 컬러링 데모",
    description: "색을 채우며 쉬어가는 시간",
    icon: (
      <>
        <path d="M12 21v-9M12 15c-4 0-7-2-7-6 4 0 7 2 7 6ZM12 12c0-4 3-7 7-7 0 4-3 7-7 7Z" />
      </>
    ),
  },
];

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
            MY WORKBOOK<span>LEARN. MAKE. REFINE.</span>
          </Link>
          <nav aria-label="Workbook 메뉴">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label} <span>↗</span>
              </Link>
            ))}
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
        {collapsed && (
          <nav className={styles.compactNav} aria-label="Workbook 메뉴">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} aria-label={item.label}>
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                </svg>
                <span className={styles.tooltip} aria-hidden="true">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </Link>
            ))}
          </nav>
        )}
      </aside>
      <div className={styles.content}>
        <WorkbookNavigationContext.Provider value={prepareLesson}>
          <WorkbookProgressProvider>
            <WorkbookCommentsProvider>{children}</WorkbookCommentsProvider>
          </WorkbookProgressProvider>
        </WorkbookNavigationContext.Provider>
      </div>
    </div>
  );
}
