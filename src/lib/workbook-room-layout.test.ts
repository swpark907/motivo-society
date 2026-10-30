import { describe, expect, it } from "vitest";
import { adjustRoomPlacement, defaultRoomLayout } from "./workbook-room-layout";
describe("작업실 배치 좌표", () => {
  it("크기를 먼저 제한하고 물건이 가로 캔버스를 벗어나지 않게 한다", () => {
    const item = defaultRoomLayout()[0];
    expect(
      adjustRoomPlacement(item, { width: 100, x: 1000, y: -10, rotation: 90, z: 100 }),
    ).toMatchObject({ width: 18, x: 80, y: 8, rotation: 30, z: 60, id: item.id });
  });
  it("비정상 좌표는 기존 값을 유지하고 입력 배치를 바꾸지 않는다", () => {
    const item = defaultRoomLayout()[0];
    const before = { ...item };
    expect(adjustRoomPlacement(item, { x: NaN, y: Infinity, width: NaN })).toEqual(item);
    expect(item).toEqual(before);
  });
});
