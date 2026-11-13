"use client";
// 클라이언트인 이유: 지금 보는 시안 화면과 그에 맞는 실제 화면·다른 시안 주소를 경로에서 읽는다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./poster.module.scss";

const SCREENS = [
  { href: "/demo/design-poster", label: "회원 홈", real: "/", other: "/demo/design-notebook" },
  {
    href: "/demo/design-poster/explore",
    label: "둘러보기",
    real: "/explore",
    other: "/demo/design-notebook/explore",
  },
  {
    href: "/demo/design-poster/activity",
    label: "활동 상세",
    real: "/activities/vibe-season-4w",
    other: "/demo/design-notebook/activity",
  },
];

/** 시안 안내 띠: 세 화면 사이 이동, 작업 노트 시안과 지금 화면 비교 링크. */
export function DraftBar() {
  const path = usePathname();
  const current = SCREENS.find((x) => x.href === path) ?? SCREENS[0];
  return (
    <nav className={s.draftBar} aria-label="시안 화면">
      <span className={s.draftTag}>POSTER DRAFT</span>
      <span className={s.draftLinks}>
        {SCREENS.map((x) => (
          <Link key={x.href} href={x.href} aria-current={x.href === path ? "page" : undefined}>
            {x.label}
          </Link>
        ))}
      </span>
      <Link href={current.other} className={s.draftCompare}>
        작업 노트 시안으로
      </Link>
      <Link href={current.real} className={s.draftCompare} style={{ marginLeft: 0 }}>
        지금 화면과 비교 →
      </Link>
    </nav>
  );
}
