import { type RoomRewardId } from "./workbook-room-rewards";
import { z } from "zod";
import { canPlaceRoomItem, createRoomWorkspace, type RoomWorkspace } from "./workbook-room-catalog";
import { roomSlots, type SlotItem } from "./workbook-room-slots";

export const ROOM_STORAGE_KEY = "motivo.workbook.room.v1";
const item = z.enum([
  "laptop",
  "notebook",
  "cup",
  "poster",
  "print",
  "plant",
  "cushion",
  "radio",
  "bonsai",
]);
const design = z.object({
  view: z.enum(["original", "coast", "garden"]),
  layout: z.object({
    desk: item.nullable(),
    tea: item.nullable(),
    wall: item.nullable(),
    floor: item.nullable(),
    lounge: item.nullable(),
  }),
});
const schema = z.object({
  version: z.literal(1),
  workspace: z.object({
    theme: z.enum(["wood", "city"]),
    rooms: z.object({ wood: design, city: design }),
  }),
  activity: z.enum(["work", "read", "rest"]),
  laptopAvailable: z.boolean(),
  laptopOwned: z.boolean(),
  available: z.array(z.enum(["print", "radio", "bonsai"])).default([]),
  // 이전 v1에서 기본 제공받은 물품은 계속 보유한다. 신규 상태는 빈 배열로 명시한다.
  owned: z.array(z.enum(["print", "radio", "bonsai"])).default(["print", "radio", "bonsai"]),
});
export type RoomCollection = z.infer<typeof schema>;
export function initialRoomCollection(): RoomCollection {
  const workspace = createRoomWorkspace();
  workspace.rooms.wood.layout.desk = "notebook";
  workspace.rooms.city.layout.desk = "notebook";
  return {
    version: 1,
    workspace,
    activity: "work",
    laptopAvailable: false,
    laptopOwned: false,
    available: [],
    owned: [],
  };
}
export function decodeRoomCollection(raw: string | null): RoomCollection {
  if (!raw) return initialRoomCollection();
  const parsed = schema.parse(JSON.parse(raw));
  for (const theme of ["wood", "city"] as const)
    for (const slot of roomSlots) {
      const id = parsed.workspace.rooms[theme].layout[slot.id];
      if (
        id &&
        (!(slot.items as readonly SlotItem[]).includes(id) ||
          !canPlaceRoomItem(id, theme) ||
          !ownRoomItem(parsed, id))
      )
        throw new Error("invalid room placement");
    }
  return parsed;
}
export function rewardEligible(completed: boolean, mode: string | null) {
  return completed && mode === "computer";
}
export function ownRoomItem(state: RoomCollection, id: SlotItem) {
  return id === "laptop"
    ? state.laptopOwned
    : id === "print" || id === "radio" || id === "bonsai"
      ? state.owned.includes(id)
      : true;
}
export function saveRoomLayout(state: RoomCollection, workspace: RoomWorkspace): RoomCollection {
  return decodeRoomCollection(JSON.stringify({ ...state, workspace }));
}

export function roomRewardAvailable(state: RoomCollection, id: RoomRewardId) {
  return id === "laptop" ? state.laptopAvailable : state.available.includes(id);
}
export function unlockRoomRewards(
  state: RoomCollection,
  ids: readonly RoomRewardId[],
): RoomCollection {
  const missing = ids.filter((id) => !roomRewardAvailable(state, id));
  if (!missing.length) return state;
  return {
    ...state,
    laptopAvailable: state.laptopAvailable || missing.includes("laptop"),
    available: [
      ...state.available,
      ...missing.filter((id): id is "print" | "radio" | "bonsai" => id !== "laptop"),
    ],
  };
}
export function claimRoomReward(state: RoomCollection, id: RoomRewardId): RoomCollection {
  if (!roomRewardAvailable(state, id) || ownRoomItem(state, id)) return state;
  return id === "laptop"
    ? { ...state, laptopOwned: true }
    : { ...state, owned: [...state.owned, id] };
}
