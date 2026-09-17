// GNB 메뉴 = 최상위 라우팅 모델. 메뉴를 바꾸면 여기만 바꾼다.
export const NAV_ITEMS = [
  { href: "/yard", label: "Yard", description: "클래스·모임 — 상품과 오프라인 강의" },
  { href: "/library", label: "Library", description: "스킬·프롬프트·사용법 — 기술 자료" },
  { href: "/article", label: "Article", description: "아티클" },
  { href: "/workbook", label: "Workbook", description: "커리큘럼·전자 교과서 (가칭)" },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]["href"];
