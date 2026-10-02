import { describe, expect, it } from "vitest";
import { findColoringRegions } from "./coloring";

describe("coloring regions", () => {
  it("keeps opposite sides of a line separate and ignores tiny specks", () => {
    const pixels = new Uint8ClampedArray(5 * 3 * 4).fill(255);
    for (let y = 0; y < 3; y++) pixels.fill(0, (y * 5 + 2) * 4, (y * 5 + 2) * 4 + 3);
    const map = findColoringRegions(pixels, 5, 3, 2);
    expect(map.seeds).toHaveLength(2);
    expect(map.ids[0]).not.toBe(map.ids[4]);
    expect(map.ids[2]).toBe(-2);
    expect(findColoringRegions(pixels, 5, 3, 7).seeds).toHaveLength(0);
  });
});
