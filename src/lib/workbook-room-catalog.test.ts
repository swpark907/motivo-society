import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import exports from "./workbook-room-assets.generated.json";
import {
  canPlaceRoomItem,
  createRoomWorkspace,
  furnitureAssets,
  listRoomResources,
  roomResourceSpec,
  sameRoomWorkspace,
} from "./workbook-room-catalog";

describe("작업실 테마와 리소스", () => {
  it("호환성과 테마별 독립 배치를 유지한다", () => {
    expect(canPlaceRoomItem("bonsai", "city")).toBe(false);
    expect(canPlaceRoomItem("radio", "city")).toBe(true);
    const original = createRoomWorkspace();
    const edited = createRoomWorkspace();
    edited.rooms.wood.layout.floor = "bonsai";
    edited.rooms.wood.view = "coast";
    edited.theme = "city";
    expect(edited.rooms.city.layout.floor).toBe("plant");
    expect(original.rooms.wood.layout.floor).toBe("plant");
    expect(sameRoomWorkspace(original, edited)).toBe(false);
    expect(sameRoomWorkspace(original, createRoomWorkspace())).toBe(true);
    expect(furnitureAssets(edited.rooms.city.layout, "read", "city").lounge.src).toContain(
      "/themes/city/sets/lounge-read-cushion.png",
    );
  });
  it("등록된 모든 파일·캔버스·알파와 배치 영역을 검사한다", () => {
    const resources = listRoomResources();
    expect(new Set(resources.map((entry) => entry.id)).size).toBe(resources.length);
    let bytes = 0;
    const seen = new Set<string>();
    for (const asset of resources) {
      const packed = (exports as Record<string, { src: string; rect: number[] }>)[asset.src];
      expect(packed, asset.id).toBeDefined();
      const webp = readFileSync(resolve(process.cwd(), "public", packed.src.slice(1)));
      expect(webp.subarray(0, 4).toString(), asset.id).toBe("RIFF");
      expect(webp.subarray(8, 12).toString(), asset.id).toBe("WEBP");
      const [px, py, pw, ph] = packed.rect;
      expect(
        px >= 0 && py >= 0 && pw > 0 && ph > 0 && px + pw <= 1536 && py + ph <= 1024,
        asset.id,
      ).toBe(true);
      const file = readFileSync(resolve(process.cwd(), "public", asset.src.slice(1)));
      if (!seen.has(asset.src)) bytes += file.length;
      seen.add(asset.src);
      expect([...file.subarray(0, 8)], asset.id).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect([file.readUInt32BE(16), file.readUInt32BE(20)], asset.id).toEqual(
        roomResourceSpec.canvas,
      );
      if (asset.kind === "object") expect(file[25], asset.id).toBe(6);
      if (asset.box) {
        const [x, y, w, h] = asset.box;
        expect(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1536 && y + h <= 1024, asset.id).toBe(
          true,
        );
      }
    }
    console.info(
      `작업실 리소스 ${resources.length}개 / 고유 파일 ${seen.size}개 · 원본 ${(bytes / 1024 / 1024).toFixed(1)} MiB · 등록 누락 없음`,
    );
  });
});
