import { describe, expect, it } from "vitest";
import { isUuid } from "./ids";

describe("id 검사", () => {
  it("8-4-4-4-12 소문자 uuid만", () => {
    expect(isUuid("00000000-0000-4000-c000-000000000006")).toBe(true);
    expect(isUuid("------------------------------------")).toBe(false);
    expect(isUuid("00000000-0000-4000-C000-000000000006")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
