import { avatarTone } from "./Avatar";

describe("avatarTone", () => {
  it("is stable for the same name", () => {
    expect(avatarTone("멤버하나")).toBe(avatarTone("멤버하나"));
  });
});
