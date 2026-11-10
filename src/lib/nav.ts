// GNB 메뉴 = 최상위 라우팅 모델. 메뉴를 바꾸면 여기만 바꾼다.
// 사람이 하러 오는 일로 나눈다. 웹 상단 GNB와 모바일 하단 탭(이후 앱)이 같은 다섯 자리를 쓴다.
// 근거: docs/product/platform-ia.md (2026-11-05 승인, 2026-11-10 이름 변경: 발견→둘러보기 · 배우기→클래스 · 나→MY)
export const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "home", description: "오늘 할 것과 내 사람들" },
  { href: "/explore", label: "둘러보기", icon: "explore", description: "모임·시즌·챌린지 찾기" },
  { href: "/clubs", label: "클럽", icon: "clubs", description: "클럽 찾기·내 클럽" },
  { href: "/learn", label: "클래스", icon: "learn", description: "워크북 클래스와 읽을거리" },
  { href: "/me", label: "MY", icon: "me", description: "내 일정·주문·프로필" },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];
export type NavHref = NavItem["href"];
export type NavIcon = NavItem["icon"];

/** 메뉴의 현재 위치. 홈은 정확히 `/`일 때만, 나머지는 하위 경로까지 포함한다. */
export function isActiveNav(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 이 메뉴 아래로 보는 다른 경로. 클래스는 기존 콘텐츠 경로(워크북·Library·Article)를 품는다. */
export const NAV_ALIASES: Record<string, NavHref> = {
  "/workbook": "/learn",
  "/library": "/learn",
  "/article": "/learn",
  "/activities": "/explore",
  "/invite": "/clubs",
  "/host": "/me",
};

/** 현재 경로가 속한 메뉴. 없으면 null. */
export function currentNav(pathname: string): NavHref | null {
  for (const item of NAV_ITEMS) {
    if (item.href !== "/" && isActiveNav(item.href, pathname)) return item.href;
  }
  for (const [prefix, href] of Object.entries(NAV_ALIASES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return href;
  }
  return pathname === "/" ? "/" : null;
}

/** 하단 탭 바를 숨기는 곳: 자체 하단 이동이 있는 학습 화면과 개발용 실험실. */
export function hidesTabBar(pathname: string): boolean {
  return pathname.startsWith("/workbook") || pathname.startsWith("/demo");
}

// 현재 검토 중인 화면만 노출한다. 완료한 시안의 라우트는 별도로 유지한다.
export const TEST_PAGE_GROUPS = [
  {
    label: "진행 중",
    items: [
      { href: "/demo/workbook-completion", label: "단원 완료·결과물 미리보기" },
      { href: "/demo/workbook-intro-sprite", label: "인트로 카피바라 스프라이트" },
      { href: "/demo/platform", label: "플랫폼 시험장(로컬 DB)" },
      { href: "/demo/design-mobile", label: "모바일 앱 문법 시안" },
      { href: "/demo/loading", label: "공용 로딩 화면" },
    ],
  },
] as const;
