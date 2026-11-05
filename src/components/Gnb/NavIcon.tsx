import type { NavIcon as NavIconName } from "@/lib/nav";

// 하단 탭 바 아이콘. 1.75px 선의 단순한 도형만 쓴다(이모지·3D 금지).
const PATHS: Record<NavIconName, string> = {
  home: "M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z",
  explore: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.5 5.5-2 5-5 2 2-5z",
  clubs:
    "M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M14 14.2c.5-.1 1-.2 1.5-.2 2.8 0 5 1.8 5 4.5",
  learn:
    "M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5ZM12 6v13.5",
  me: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8.5c.8-3.5 3.8-6 7.5-6s6.7 2.5 7.5 6",
};

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
