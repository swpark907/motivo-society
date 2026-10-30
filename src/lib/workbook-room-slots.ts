// 고정 카메라·전체 캔버스 레이어. 좌표는 사용자가 바꾸지 않는다.
export const roomSlots = [
  { id: "desk", name: "책상 도구", hint: "만들고 기록하는 자리", items: ["laptop", "notebook"] },
  { id: "tea", name: "책상 한쪽", hint: "잠깐 쉬어가는 자리", items: ["cup", "radio"] },
  { id: "wall", name: "벽", hint: "오늘의 취향을 거는 자리", items: ["poster", "print"] },
  { id: "floor", name: "바닥 한쪽", hint: "초록을 들이는 자리", items: ["plant", "bonsai"] },
  { id: "lounge", name: "휴식 공간", hint: "편안함을 더하는 자리", items: ["cushion"] },
] as const;
export const slotItems = {
  laptop: "첫 노트북",
  notebook: "아이디어 노트",
  cup: "쉬어가는 머그",
  poster: "해 질 녘 액자",
  print: "초록 잎 포스터",
  plant: "작은 고무나무",
  cushion: "오렌지 쿠션",
  radio: "작은 라디오",
  bonsai: "돌 위의 작은 나무",
} as const;
export type SlotId = (typeof roomSlots)[number]["id"];
export type SlotItem = keyof typeof slotItems;
export type SlotLayout = Record<SlotId, SlotItem | null>;
export const initialSlotLayout: SlotLayout = {
  desk: "laptop",
  tea: "cup",
  wall: "poster",
  floor: "plant",
  lounge: "cushion",
};
export const roomActivities = [
  { id: "work", name: "작업하기" },
  { id: "read", name: "책 읽기" },
  { id: "rest", name: "쉬어가기" },
] as const;

export type RoomActivity = (typeof roomActivities)[number]["id"];
// 맞닿는 가구·캐릭터·도구는 한 세트로 선택해 접점과 단일 캐릭터를 유지한다.
export function roomFurnitureSets(layout: SlotLayout, activity: RoomActivity) {
  const tool = layout.desk ?? "empty";
  const cushion = layout.lounge ? "cushion" : "plain";
  return {
    desk: `desk-${activity === "work" ? "work" : "idle"}-${tool}`,
    lounge: `lounge-${activity === "read" ? "read" : "idle"}-${cushion}`,
  };
}

// 생성 원본의 불투명 영역을 측정한 값. 파일을 자르지 않고 CSS로 동일 카메라에 맞춘다.
export const roomArt = {
  laptop: { box: [609, 276, 400, 302], place: [56, 32, 9] },
  notebook: { box: [523, 329, 752, 413], place: [56, 37, 9] },
  cup: { box: [974, 359, 233, 157], place: [68, 39, 3.5] },
  poster: { box: [845, 95, 481, 415], place: [56, 16, 10] },
  print: { box: [713, 95, 347, 585], place: [57, 12, 8] },
  plant: { box: [1104, 386, 291, 410], place: [82, 55, 9] },
  cushion: { box: [258, 369, 502, 407], place: [18, 52, 7] },
  work: { box: [547, 98, 529, 714], place: [48.5, 27, 13] },
  read: { box: [379, 200, 545, 635], place: [17.5, 41, 15] },
  rest: { box: [516, 279, 446, 551], place: [44, 60, 13] },
  radio: { box: [226, 46, 1105, 902], place: [67, 36, 5] },
  bonsai: { box: [232, 15, 1004, 943], place: [82, 61, 8] },
} as const;
