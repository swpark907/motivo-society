import { describe, expect, it } from "vitest";
import { eligibleRoomRewards } from "./workbook-room-rewards";
import {
  initialRoomCollection,
  unlockRoomRewards,
  claimRoomReward,
  ownRoomItem,
  decodeRoomCollection,
} from "./workbook-room-collection";

describe("단원별 수집품", () => {
  it("첫 제작은 컴퓨터 실습만, 나머지는 각 단원의 완료를 따른다", () => {
    const progress = {
      projectCompleted: true,
      projectMode: "example",
      experienceCompleted: true,
      dataCompleted: false,
      publishCompleted: true,
    };
    expect(eligibleRoomRewards(progress)).toEqual(["print", "bonsai"]);
    expect(
      eligibleRoomRewards({ ...progress, projectMode: "computer", dataCompleted: true }),
    ).toEqual(["laptop", "print", "radio", "bonsai"]);
    expect(
      eligibleRoomRewards({
        projectCompleted: false,
        projectMode: null,
        experienceCompleted: false,
        dataCompleted: false,
        publishCompleted: false,
      }),
    ).toEqual([]);
  });
  it("조건 전 수령을 막고 중복 지급 없이 복원하며 수령만으로 배치를 바꾸지 않는다", () => {
    const initial = initialRoomCollection();
    expect(claimRoomReward(initial, "radio")).toBe(initial);
    const unlocked = unlockRoomRewards(initial, ["radio", "print"]);
    expect(unlockRoomRewards(unlocked, ["radio"])).toBe(unlocked);
    const claimed = claimRoomReward(unlocked, "radio");
    expect(claimRoomReward(claimed, "radio")).toBe(claimed);
    expect(claimed.workspace).toEqual(initial.workspace);
    const restored = decodeRoomCollection(JSON.stringify(claimed));
    expect(ownRoomItem(restored, "radio")).toBe(true);
    expect(ownRoomItem(restored, "print")).toBe(false);
  });
  it("기존 저장에서 기본 지급받은 세 물건과 배치를 회수하지 않는다", () => {
    const { available: _available, owned: _owned, ...legacy } = initialRoomCollection();
    void _available;
    void _owned;
    legacy.workspace.rooms.wood.layout.tea = "radio";
    const migrated = decodeRoomCollection(JSON.stringify(legacy));
    expect(migrated.owned).toEqual(["print", "radio", "bonsai"]);
    expect(migrated.workspace.rooms.wood.layout.tea).toBe("radio");
  });
});
