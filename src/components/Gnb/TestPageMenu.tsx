"use client";

// 임시 개발 화면 이동 뒤 열린 목록을 닫는다. 바깥 클릭·Escape는 네이티브 popover에 맡긴다.
import Link from "next/link";
import { useRef } from "react";
import { TEST_PAGE_GROUPS } from "@/lib/nav";
import styles from "./TestPageMenu.module.scss";

export function TestPageMenu() {
  const menu = useRef<HTMLDivElement>(null);
  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        popoverTarget="test-page-menu"
        aria-label="테스트 화면 열기"
        aria-haspopup="dialog"
      >
        테스트
      </button>
      <div
        id="test-page-menu"
        ref={menu}
        popover="auto"
        role="dialog"
        className={styles.panel}
        aria-labelledby="test-page-menu-title"
      >
        <header>
          <div>
            <strong id="test-page-menu-title">테스트 화면</strong>
            <small>개발 중 임시 바로가기</small>
          </div>
          <button
            type="button"
            popoverTarget="test-page-menu"
            popoverTargetAction="hide"
            aria-label="테스트 화면 닫기"
          >
            닫기 ×
          </button>
        </header>
        <nav aria-label="테스트 화면 목록">
          {TEST_PAGE_GROUPS.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2>{group.label}</h2>
              <ul>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={() => menu.current?.hidePopover()}>
                      {item.label}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </div>
    </>
  );
}
