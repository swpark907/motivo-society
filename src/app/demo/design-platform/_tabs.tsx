"use client";
// 클라이언트인 이유: 지금 보고 있는 시안 탭을 표시하려면 현재 경로가 필요하다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./design.module.scss";

const TABS = [
  { href: "/demo/design-platform/explore", label: "발견" },
  { href: "/demo/design-platform/activity", label: "활동 상세" },
  { href: "/demo/design-platform/home", label: "회원 홈" },
];

export function DraftTabs() {
  const pathname = usePathname();
  return (
    <nav className={s.draftTabs} aria-label="시안 화면">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={pathname === t.href ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
