import { getAllYardItems } from "./yard";

describe("content/yard", () => {
  it("every committed item parses and is sorted by order", async () => {
    const all = await getAllYardItems();
    expect(all.length).toBeGreaterThan(0);
    const orders = all.map((i) => i.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
