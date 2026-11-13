"use client";
// 클라이언트인 이유: 지금 보는 시안 화면과 그에 맞는 실제 화면 주소를 경로에서 읽는다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./notebook.module.scss";

const SCREENS = [
  { href: "/demo/design-notebook", label: "회원 홈", real: "/" },
  { href: "/demo/design-notebook/explore", label: "둘러보기", real: "/explore" },
  {
    href: "/demo/design-notebook/activity",
    label: "활동 상세",
    real: "/activities/vibe-season-4w",
  },
];

/** 시안 안내 띠: 세 화면 사이 이동과 지금 화면 비교 링크. */
export function DraftBar() {
  const path = usePathname();
  const current = SCREENS.find((x) => x.href === path) ?? SCREENS[0];
  return (
    <nav className={s.draftBar} aria-label="시안 화면">
      <span className={s.draftTag}>WORK NOTE DRAFT</span>
      <span className={s.draftLinks}>
        {SCREENS.map((x) => (
          <Link key={x.href} href={x.href} aria-current={x.href === path ? "page" : undefined}>
            {x.label}
          </Link>
        ))}
      </span>
      <Link
        href={current.href.replace("design-notebook", "design-poster")}
        className={s.draftCompare}
      >
        포스터 시안으로
      </Link>
      <Link href={current.real} className={s.draftCompare} style={{ marginLeft: 0 }}>
        지금 화면과 비교 →
      </Link>
    </nav>
  );
}
