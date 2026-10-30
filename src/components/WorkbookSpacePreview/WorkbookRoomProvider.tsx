"use client";

// 작업실만 브라우저에 보존한다. 클래스 학습 기록·회원 보상 서버와는 분리한다.
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  claimRoomReward,
  unlockRoomRewards,
  decodeRoomCollection,
  initialRoomCollection,
  ROOM_STORAGE_KEY,
  saveRoomLayout,
  type RoomCollection,
} from "@/lib/workbook-room-collection";
import { type RoomRewardId } from "@/lib/workbook-room-rewards";
import type { RoomWorkspace } from "@/lib/workbook-room-catalog";
import type { RoomActivity } from "@/lib/workbook-room-slots";

type Snapshot = { collection: RoomCollection; status: "ready" | "memory" | "invalid" };
const initial: Snapshot = { collection: initialRoomCollection(), status: "ready" };
let current: Snapshot | undefined;
const listeners = new Set<() => void>();
function snapshot() {
  if (typeof window === "undefined") return initial;
  if (!current) {
    try {
      current = {
        collection: decodeRoomCollection(localStorage.getItem(ROOM_STORAGE_KEY)),
        status: "ready",
      };
    } catch {
      current = { collection: initialRoomCollection(), status: "invalid" };
    }
  }
  return current;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function update(change: (state: RoomCollection) => RoomCollection) {
  const before = snapshot();
  const collection = change(before.collection);
  if (collection === before.collection) return;
  let status: Snapshot["status"] = "ready";
  try {
    localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(collection));
  } catch {
    status = "memory";
  }
  current = { collection, status };
  listeners.forEach((listener) => listener());
}
function useRoomState() {
  const state = useSyncExternalStore(subscribe, snapshot, () => initial);
  return {
    ...state,
    save: (workspace: RoomWorkspace) => update((value) => saveRoomLayout(value, workspace)),
    setActivity: (activity: RoomActivity) =>
      update((value) => (value.activity === activity ? value : { ...value, activity })),
    claim: (id: RoomRewardId = "laptop") => update((value) => claimRoomReward(value, id)),
  };
}
const Context = createContext<ReturnType<typeof useRoomState> | null>(null);
export function WorkbookRoomProvider({
  eligible,
  children,
}: {
  eligible: readonly RoomRewardId[];
  children: ReactNode;
}) {
  const state = useRoomState();
  const eligibilityKey = eligible.join(",");
  useEffect(() => {
    const ids = eligibilityKey ? (eligibilityKey.split(",") as RoomRewardId[]) : [];
    update((value) => unlockRoomRewards(value, ids));
  }, [eligibilityKey]);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useWorkbookRoom() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkbookRoomProvider is required");
  return value;
}
