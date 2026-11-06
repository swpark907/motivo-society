// 디자인 시안 전용 고정 예시. 실제 데이터·DB와 연결하지 않는다.
// 표지 사진은 ChatGPT로 만든 연출 이미지(카피바라 장면)다. 실제 모임 사진이 아니다.

export type Kind = "gathering" | "series" | "challenge";

export type MockActivity = {
  slug: string;
  kind: Kind;
  title: string;
  host: string;
  hostKind: "club" | "host" | "official";
  cover: string;
  when: string;
  day: string; // 표지 위 날짜 배지 (예: "오늘", "D-3")
  place: string;
  online: boolean;
  price: number;
  capacity: number | null;
  joined: number;
  people: string[];
  live?: boolean; // 진행 중 · 중도 합류
};

const C = "/images/platform/mock";

export const ACTIVITIES: MockActivity[] = [
  {
    slug: "tonight-mogakco",
    kind: "gathering",
    title: "오늘 저녁 온라인 모각코",
    host: "주말 바이브코딩 클럽",
    hostKind: "club",
    cover: `${C}/cover-online-mogakco.jpg`,
    when: "오늘 · 오후 8:00 – 10:00",
    day: "오늘",
    place: "온라인",
    online: true,
    price: 0,
    capacity: 4,
    joined: 3,
    people: ["참가자1", "참가자2", "참가자3"],
  },
  {
    slug: "vibe-season-4w",
    kind: "series",
    title: "4주 바이브코딩 시즌 — 내 서비스 하나 끝까지",
    host: "바라호스트",
    hostKind: "host",
    cover: `${C}/cover-season-studio.jpg`,
    when: "매주 수 · 오후 7:30 · 4회",
    day: "2회차 오늘",
    place: "온라인",
    online: true,
    price: 40000,
    capacity: 6,
    joined: 2,
    people: ["참가자1", "참가자2"],
    live: true,
  },
  {
    slug: "daily-build-2w",
    kind: "challenge",
    title: "2주 매일 하나씩 만들기",
    host: "주말 바이브코딩 클럽",
    hostKind: "club",
    cover: `${C}/cover-challenge-notebook.jpg`,
    when: "11.1 – 11.14 · 매일 인증",
    day: "5일차",
    place: "온라인",
    online: true,
    price: 0,
    capacity: null,
    joined: 3,
    people: ["참가자1", "참가자2", "멤버하나"],
    live: true,
  },
  {
    slug: "capybara-cafe",
    kind: "gathering",
    title: "카피바라 카페에서 AI 수다",
    host: "바라호스트",
    hostKind: "host",
    cover: `${C}/cover-cafe-chat.jpg`,
    when: "11.8 (일) · 오후 7:30",
    day: "D-3",
    place: "서울 마포구 · 망원동",
    online: false,
    price: 0,
    capacity: 6,
    joined: 2,
    people: ["참가자4", "멤버하나"],
  },
  {
    slug: "ai-tools-workshop",
    kind: "gathering",
    title: "AI 도구 실습 워크숍 — 같은 결과물, 세 가지 도구",
    host: "바라호스트",
    hostKind: "host",
    cover: `${C}/cover-workshop.jpg`,
    when: "11.15 (일) · 오후 7:30 – 10:30",
    day: "D-10",
    place: "서울 마포구 · 합정",
    online: false,
    price: 15000,
    capacity: 3,
    joined: 2,
    people: ["참가자4", "참가자5"],
  },
  {
    slug: "prompt-clinic",
    kind: "gathering",
    title: "프롬프트 클리닉 — 막힌 요청문 같이 고치기",
    host: "바라호스트",
    hostKind: "host",
    cover: `${C}/cover-prompt-clinic.jpg`,
    when: "11.10 (화) · 오후 7:30",
    day: "D-5",
    place: "온라인",
    online: true,
    price: 20000,
    capacity: 5,
    joined: 0,
    people: [],
  },
  {
    slug: "members-retro",
    kind: "gathering",
    title: "멤버끼리 한 달 회고",
    host: "주말 바이브코딩 클럽",
    hostKind: "club",
    cover: `${C}/cover-retro.jpg`,
    when: "11.12 (목) · 오후 7:30",
    day: "D-7",
    place: "서울 성동구 · 성수",
    online: false,
    price: 0,
    capacity: 8,
    joined: 1,
    people: ["참가자1"],
  },
];

export const KIND_LABEL: Record<Kind, string> = {
  gathering: "모임",
  series: "시즌",
  challenge: "챌린지",
};

export function seatsLabel(a: MockActivity): string {
  if (a.capacity === null) return `${a.joined}명 참여 중`;
  const left = a.capacity - a.joined;
  if (left <= 0) return "마감 · 대기 가능";
  if (left <= 2) return `${left}자리 남음`;
  return `${a.joined}/${a.capacity}명`;
}

export function priceLabel(price: number): string {
  return price === 0 ? "무료" : `${price.toLocaleString("ko-KR")}원`;
}
