import {
  initialSlotLayout,
  roomFurnitureSets,
  type RoomActivity,
  type SlotItem,
  type SlotLayout,
  slotItems,
  roomArt,
} from "./workbook-room-slots";

const root = "/images/workbook/room/";
export const roomThemes = {
  wood: {
    name: "햇살 드는 나무 작업실",
    base: root + "slots/base.png",
    sets: root + "slots/sets/",
    description: "따뜻한 나무와 초록이 있는 방",
  },
  city: {
    name: "차분한 도시 작업실",
    base: root + "themes/city/base.png",
    sets: root + "themes/city/sets/",
    description: "월넛 가구와 세이지 패브릭의 방",
  },
} as const;
export type RoomTheme = keyof typeof roomThemes;
export function roomObjectResource(id: keyof typeof roomArt) {
  return { src: root + "slots/" + id + ".png", ...roomArt[id] };
}
export const roomViews = {
  original: { name: "테마 기본 풍경", file: null },
  coast: { name: "바다가 보이는 창", file: root + "views/coast.png" },
  garden: { name: "초록 정원의 창", file: root + "views/garden.png" },
} as const;
export type RoomView = keyof typeof roomViews;

// 슬롯과 선택 상태는 논리 ID로 보존하고, 테마별 자산은 아래 경계에서만 연결한다.
export const roomResourceSpec = {
  camera: "cutaway-3quarter-v1",
  canvas: [1536, 1024],
  lighting: "warm-daylight-left-v1",
  character: "round-glasses-black-tie-v1",
  contactSetMasks: { desk: [44, 24, 76, 66], lounge: [11, 42, 36, 76] },
  version: 2,
} as const;
export const roomItemCompatibility: Record<SlotItem, readonly RoomTheme[]> = {
  laptop: ["wood", "city"],
  notebook: ["wood", "city"],
  cup: ["wood", "city"],
  poster: ["wood", "city"],
  print: ["wood", "city"],
  plant: ["wood", "city"],
  cushion: ["wood", "city"],
  radio: ["wood", "city"],
  bonsai: ["wood"],
};
export function canPlaceRoomItem(id: SlotItem, theme: RoomTheme) {
  return roomItemCompatibility[id].includes(theme);
}
export function furnitureAssets(layout: SlotLayout, activity: RoomActivity, theme: RoomTheme) {
  const sets = roomFurnitureSets(layout, activity);
  return {
    desk: { id: sets.desk, src: roomSetSource(theme, sets.desk) },
    lounge: { id: sets.lounge, src: roomSetSource(theme, sets.lounge) },
  };
}
function roomSetSource(theme: RoomTheme, id: string) {
  // 빈 가구는 기본 배경을 재사용해 동일한 전체 캔버스 파일을 중복 저장하지 않는다.
  return id === "desk-idle-empty" || id === "lounge-idle-plain"
    ? roomThemes[theme].base
    : roomThemes[theme].sets + id + ".png";
}
export type RoomDesign = { layout: SlotLayout; view: RoomView };
export type RoomWorkspace = { theme: RoomTheme; rooms: Record<RoomTheme, RoomDesign> };
export function createRoomWorkspace(): RoomWorkspace {
  return {
    theme: "wood",
    rooms: {
      wood: { layout: { ...initialSlotLayout }, view: "original" },
      city: { layout: { ...initialSlotLayout }, view: "original" },
    },
  };
}
export function sameRoomWorkspace(a: RoomWorkspace, b: RoomWorkspace) {
  return (
    a.theme === b.theme &&
    (Object.keys(roomThemes) as RoomTheme[]).every(
      (theme) =>
        a.rooms[theme].view === b.rooms[theme].view &&
        (Object.keys(initialSlotLayout) as (keyof SlotLayout)[]).every(
          (slot) => a.rooms[theme].layout[slot] === b.rooms[theme].layout[slot],
        ),
    )
  );
}

export function listRoomResources() {
  const resources: {
    id: string;
    src: string;
    kind: "base" | "set" | "view" | "object";
    themes: readonly RoomTheme[];
    box?: readonly number[];
    place?: readonly number[];
  }[] = [];
  for (const theme of Object.keys(roomThemes) as RoomTheme[]) {
    resources.push({
      id: `${theme}/base`,
      src: roomThemes[theme].base,
      kind: "base",
      themes: [theme],
    });
    for (const state of ["work", "idle"])
      for (const tool of ["laptop", "notebook", "empty"])
        resources.push({
          id: `${theme}/desk-${state}-${tool}`,
          src: roomSetSource(theme, `desk-${state}-${tool}`),
          kind: "set",
          themes: [theme],
        });
    for (const state of ["read", "idle"])
      for (const cushion of ["cushion", "plain"])
        resources.push({
          id: `${theme}/lounge-${state}-${cushion}`,
          src: roomSetSource(theme, `lounge-${state}-${cushion}`),
          kind: "set",
          themes: [theme],
        });
  }
  for (const [id, view] of Object.entries(roomViews))
    if (view.file)
      resources.push({ id: `view/${id}`, src: view.file, kind: "view", themes: ["wood", "city"] });
  for (const id of [...Object.keys(slotItems), "rest"] as (SlotItem | "rest")[])
    resources.push({
      id: `object/${id}`,
      src: root + "slots/" + id + ".png",
      kind: "object",
      themes: id === "rest" ? ["wood", "city"] : roomItemCompatibility[id],
      box: roomArt[id].box,
      place: roomArt[id].place,
    });
  return resources;
}
