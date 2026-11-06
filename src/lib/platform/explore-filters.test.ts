import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  exploreHref,
  hasFilters,
  matchesFilters,
  parseExploreFilters,
  type FilterableActivity,
} from "./explore-filters";

const NOW = new Date("2026-11-06T13:30:00Z"); // 11.6(금) KST, 이번 주 11.2~11.8

const gathering: FilterableActivity = {
  kind: "gathering",
  online: false,
  price: 0,
  startsAt: "2026-11-08T10:00:00Z", // 11.8(일)
  endsAt: "2026-11-08T12:00:00Z",
};

describe("parseExploreFilters", () => {
  it("아는 값만 읽는다", () => {
    expect(
      parseExploreFilters({ kind: "series", format: "online", when: "next-week", free: "1" }),
    ).toEqual({ kind: "series", format: "online", when: "next-week", free: true });
    expect(parseExploreFilters({ kind: "party", free: "yes", when: ["this-week", "x"] })).toEqual({
      ...EMPTY_FILTERS,
      when: "this-week",
    });
  });
});

describe("exploreHref", () => {
  it("값을 더하고, 같은 값을 다시 누르면 뺀다", () => {
    const f = { ...EMPTY_FILTERS, kind: "gathering" as const };
    expect(exploreHref(f, { free: true })).toBe("/explore?kind=gathering&free=1");
    expect(exploreHref(f, { kind: "gathering" })).toBe("/explore");
    expect(exploreHref(f, { kind: "series" })).toBe("/explore?kind=series");
    expect(hasFilters(EMPTY_FILTERS)).toBe(false);
  });
});

describe("matchesFilters", () => {
  it("종류·형식·무료", () => {
    expect(matchesFilters(gathering, { ...EMPTY_FILTERS, kind: "series" }, NOW)).toBe(false);
    expect(matchesFilters(gathering, { ...EMPTY_FILTERS, format: "offline" }, NOW)).toBe(true);
    expect(matchesFilters(gathering, { ...EMPTY_FILTERS, format: "online" }, NOW)).toBe(false);
    expect(
      matchesFilters({ ...gathering, price: 15000 }, { ...EMPTY_FILTERS, free: true }, NOW),
    ).toBe(false);
  });

  it("이번 주·다음 주는 기간이 겹치면 포함한다", () => {
    const thisWeek = { ...EMPTY_FILTERS, when: "this-week" as const };
    const nextWeek = { ...EMPTY_FILTERS, when: "next-week" as const };
    expect(matchesFilters(gathering, thisWeek, NOW)).toBe(true);
    expect(matchesFilters(gathering, nextWeek, NOW)).toBe(false);
    const season = {
      ...gathering,
      kind: "series" as const,
      startsAt: "2026-10-30T10:00:00Z",
      endsAt: "2026-11-20T12:00:00Z",
    };
    expect(matchesFilters(season, thisWeek, NOW)).toBe(true);
    expect(matchesFilters(season, nextWeek, NOW)).toBe(true);
    expect(matchesFilters({ ...gathering, startsAt: null }, thisWeek, NOW)).toBe(false);
  });
});
