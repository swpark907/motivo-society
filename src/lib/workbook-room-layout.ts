// 좌표는 방 전체의 백분율이다. 회원 저장·실제 획득 상태에는 연결하지 않는다.
export const roomObjects = [
  {
    id: "notebook",
    name: "공방의 기획 노트",
    file: "notebook-v1.png",
    reason: "기획하고 첫 화면 만들기 · 예시 수집품",
    width: 7,
    x: 61.8,
    y: 40,
  },
  {
    id: "cup",
    name: "늘 쓰던 머그",
    file: "cup-v1.png",
    reason: "처음부터 함께하는 기본 소품",
    width: 5,
    x: 68,
    y: 42,
  },
  {
    id: "lamp",
    name: "작업실 스탠드",
    file: "lamp-v1.png",
    reason: "AI 도구 준비하기 · 예시 수집품",
    width: 8,
    x: 71,
    y: 31,
  },
] as const;
export type RoomObjectId = (typeof roomObjects)[number]["id"];
export type RoomPlacement = {
  id: RoomObjectId;
  x: number;
  y: number;
  width: number;
  rotation: number;
  z: number;
  visible: boolean;
};
export const defaultRoomLayout = (): RoomPlacement[] =>
  roomObjects.map((item, index) => ({
    id: item.id,
    x: item.x,
    y: item.y,
    width: item.width,
    rotation: 0,
    z: 30 + index,
    visible: true,
  }));
export function adjustRoomPlacement(
  item: RoomPlacement,
  patch: Partial<RoomPlacement>,
): RoomPlacement {
  const next = { ...item, ...patch, id: item.id };
  next.width = Math.max(3, Math.min(18, Number.isFinite(next.width) ? next.width : item.width));
  next.x = Math.max(2, Math.min(98 - next.width, Number.isFinite(next.x) ? next.x : item.x));
  next.y = Math.max(8, Math.min(85, Number.isFinite(next.y) ? next.y : item.y));
  next.rotation = Math.max(
    -30,
    Math.min(30, Number.isFinite(next.rotation) ? next.rotation : item.rotation),
  );
  next.z = Math.max(1, Math.min(60, Number.isFinite(next.z) ? next.z : item.z));
  return next;
}
