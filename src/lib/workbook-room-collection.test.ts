import { describe, expect, it } from "vitest";
import {
  decodeRoomCollection,
  initialRoomCollection,
  ownRoomItem,
  rewardEligible,
  saveRoomLayout,
} from "./workbook-room-collection";
describe("작업실 수집·브라우저 저장", () => {
  it("기본 물품과 컴퓨터 제작 완료 수집품을 구분한다", () => {
    const state = initialRoomCollection();
    expect(state.workspace.rooms.wood.layout.desk).toBe("notebook");
    expect(ownRoomItem(state, "laptop")).toBe(false);
    expect(ownRoomItem(state, "radio")).toBe(false);
    expect(ownRoomItem(state, "cup")).toBe(true);
    expect(rewardEligible(true, "example")).toBe(false);
    expect(rewardEligible(false, "computer")).toBe(false);
    expect(rewardEligible(true, "computer")).toBe(true);
  });
  it("저장 복원과 수집 조건·자리 호환성을 검사한다", () => {
    const state = initialRoomCollection();
    expect(decodeRoomCollection(JSON.stringify(state))).toEqual(state);
    const workspace = structuredClone(state.workspace);
    workspace.rooms.wood.layout.desk = "laptop";
    expect(() => saveRoomLayout(state, workspace)).toThrow();
    expect(
      saveRoomLayout({ ...state, laptopAvailable: true, laptopOwned: true }, workspace).workspace,
    ).toEqual(workspace);
    workspace.rooms.city.layout.floor = "bonsai";
    expect(() => saveRoomLayout({ ...state, laptopOwned: true }, workspace)).toThrow();
    expect(() => decodeRoomCollection("broken")).toThrow();
    expect(() => decodeRoomCollection('{"version":99}')).toThrow();
  });
});
