import { describe, expect, it } from "vitest";
import { currentNav, hidesTabBar, NAV_ITEMS } from "./nav";

describe("nav", () => {
  it("has the five approved menus in order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["홈", "발견", "클럽", "배우기", "나"]);
  });

  it("finds the current menu including nested and aliased paths", () => {
    expect(currentNav("/")).toBe("/");
    expect(currentNav("/explore")).toBe("/explore");
    expect(currentNav("/clubs/weekend-vibe")).toBe("/clubs");
    expect(currentNav("/activities/tonight")).toBe("/explore");
    expect(currentNav("/workbook/vibe-web")).toBe("/learn");
    expect(currentNav("/article/hello")).toBe("/learn");
    expect(currentNav("/login")).toBeNull();
  });

  it("hides the tab bar on immersive learning and lab screens", () => {
    expect(hidesTabBar("/workbook")).toBe(true);
    expect(hidesTabBar("/demo/platform")).toBe(true);
    expect(hidesTabBar("/explore")).toBe(false);
  });
});
