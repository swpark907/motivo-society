import { describe, expect, it } from "vitest";
import { initialSlotLayout, roomFurnitureSets } from "./workbook-room-slots";

describe("맞닿는 가구와 캐릭터 세트", () => {
  it("선택한 도구와 행동에 맞춰 작업 자리와 독서 자리 중 한 곳에만 캐릭터를 둔다", () => {
    expect(roomFurnitureSets(initialSlotLayout, "work")).toEqual({
      desk: "desk-work-laptop",
      lounge: "lounge-idle-cushion",
    });
    expect(
      roomFurnitureSets({ ...initialSlotLayout, desk: "notebook", lounge: null }, "read"),
    ).toEqual({ desk: "desk-idle-notebook", lounge: "lounge-read-plain" });
    expect(roomFurnitureSets({ ...initialSlotLayout, desk: null }, "rest")).toEqual({
      desk: "desk-idle-empty",
      lounge: "lounge-idle-cushion",
    });
  });
});
