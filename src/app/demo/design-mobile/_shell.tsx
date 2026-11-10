import Link from "next/link";
import type { ReactNode } from "react";
import s from "./mobile.module.scss";

// 시안 전용 선 아이콘(1.75px). 이모지·3D 아이콘을 쓰지 않는다.
const P = {
  back: "M15 5l-7 7 7 7",
  chev: "M9 6l6 6-6 6",
  share: "M12 4v11m-4-7 4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5",
  filter: "M4 6h16M7 12h10M10 18h4",
  calendar:
    "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M9 3v4m6-4v4",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  users:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.2a3.5 3.5 0 0 1 0 6.6M18 14.3c1.8.8 3 2.6 3 4.7",
  video:
    "M4 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm12 3.5 4-2.5v8l-4-2.5",
  won: "M4 8l3 10 3-10 2 0 3 10 3-10M3 12h18",
  check: "m5 12.5 4.5 4.5L19 7.5",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  copy: "M8 8h11v11H8zM5 16V5h11",
  plus: "M12 5v14M5 12h14",
  home: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5z",
  club: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.2a3.5 3.5 0 0 1 0 6.6M18 14.3c1.8.8 3 2.6 3 4.7",
  book: "M4 5a2 2 0 0 1 2-2h5v17H6a2 2 0 0 1-2-2zm16 0a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 0 2-2z",
  me: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9c0-4 3.6-7 8-7s8 3 8 7",
} as const;

export type IconName = keyof typeof P;

export function Ic({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={P[name]} />
    </svg>
  );
}

/** 탭 첫 화면의 상단: 큰 제목 하나. 오른쪽에 아이콘 행동 하나까지. */
export function RootBar({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className={s.rootBar}>
      <h1 className={s.rootTitle}>{title}</h1>
      {action}
    </header>
  );
}

/** 하위 화면의 상단: ← 와 가운데 제목. 화면 맨 위에 붙어 있다. */
export function SubBar({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref: string;
  action?: ReactNode;
}) {
  return (
    <header className={s.subBar}>
      <Link href={backHref} className={s.iconBtn} aria-label="뒤로">
        <Ic name="back" />
      </Link>
      <h1 className={s.subTitle}>{title}</h1>
      <span className={s.subAction}>{action}</span>
    </header>
  );
}

const TABS = [
  { label: "홈", icon: "home" },
  { label: "둘러보기", icon: "compass" },
  { label: "클럽", icon: "club" },
  { label: "클래스", icon: "book" },
  { label: "MY", icon: "me" },
] as const;

/** 시안 안의 하단 탭 바(실제 GNB와 같은 다섯 자리). 시안이라 이동하지 않는다. */
export function MockTabBar({ current }: { current: (typeof TABS)[number]["label"] }) {
  return (
    <nav className={s.tabBar} aria-label="하단 메뉴(시안)">
      {TABS.map((t) => (
        <span
          key={t.label}
          className={s.tab}
          aria-current={t.label === current ? "page" : undefined}
        >
          <Ic name={t.icon} size={22} />
          {t.label}
        </span>
      ))}
    </nav>
  );
}

/** 목록 행: 아이콘 · 주 문장 · 보조 문장 · 오른쪽 값이나 › */
export function Row({
  icon,
  main,
  sub,
  end,
  href,
}: {
  icon?: IconName;
  main: ReactNode;
  sub?: ReactNode;
  end?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      {icon && (
        <span className={s.rowIcon}>
          <Ic name={icon} size={18} />
        </span>
      )}
      <span className={s.rowText}>
        <span className={s.rowMain}>{main}</span>
        {sub && <span className={s.rowSub}>{sub}</span>}
      </span>
      {end !== undefined ? <span className={s.rowEnd}>{end}</span> : null}
      {href && (
        <span className={s.rowChev}>
          <Ic name="chev" size={16} />
        </span>
      )}
    </>
  );
  // data-icon: 아이콘이 있는 행은 다음 행의 구분선을 글자 시작점까지 들여 쓴다.
  return href ? (
    <Link href={href} className={s.row} data-icon={icon ? "" : undefined}>
      {body}
    </Link>
  ) : (
    <div className={s.row} data-icon={icon ? "" : undefined}>
      {body}
    </div>
  );
}

/** 묶음 카드: 제목(선택) + 행들. 섹션 구분을 줄 대신 면으로 한다. */
export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className={s.group} aria-label={title}>
      {title && <h2 className={s.groupTitle}>{title}</h2>}
      <div className={s.groupBody}>{children}</div>
    </section>
  );
}

export function Face({ name, kind = "gathering" }: { name: string; kind?: string }) {
  return (
    <span className={s.face} data-kind={kind} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}
