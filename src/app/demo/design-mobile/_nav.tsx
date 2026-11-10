"use client";
// 클라이언트인 이유: 현재 시안 화면을 표시하려고 경로를 읽는다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./mobile.module.scss";

const SCREENS = [
  { href: "/demo/design-mobile/explore", label: "둘러보기 (탭 첫 화면)" },
  { href: "/demo/design-mobile/activity", label: "활동 상세 + 신청 시트" },
  { href: "/demo/design-mobile/host", label: "호스트 활동 관리" },
];

/** 넓은 화면의 시안 고르기(휴대폰 틀 밖). */
export function MobileDraftNav() {
  const path = usePathname();
  return (
    <nav aria-label="시안 화면" className={s.draftNav}>
      {SCREENS.map((x) => (
        <Link key={x.href} href={x.href} aria-current={path === x.href ? "page" : undefined}>
          {x.label}
        </Link>
      ))}
    </nav>
  );
}
