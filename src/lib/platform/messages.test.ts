import { describe, expect, it } from "vitest";
import {
  CLUB_PERMISSIONS,
  errorCodeFrom,
  errorMessage,
  noticeMessage,
  statusTone,
  won,
} from "./messages";

describe("platform messages", () => {
  it("extracts a bare code from a raised exception", () => {
    expect(errorCodeFrom("members_only")).toBe("members_only");
    expect(errorCodeFrom("duplicate key value violates unique constraint")).toBe("unknown");
    expect(errorCodeFrom(undefined)).toBe("unknown");
  });

  it("falls back to the code for unknown errors", () => {
    expect(errorMessage("members_only")).toContain("클럽 멤버");
    expect(errorMessage("weird")).toContain("weird");
  });

  it("returns null for unknown notices", () => {
    expect(noticeMessage("confirmed")).toContain("확정");
    expect(noticeMessage("nope")).toBeNull();
  });

  it("formats won amounts", () => {
    expect(won(15000)).toBe("15,000원");
  });

  it("lists the eleven club permissions the DB allows", () => {
    expect(CLUB_PERMISSIONS.map((p) => p.id)).toEqual([
      "club.edit",
      "space.manage",
      "member.approve",
      "member.ban",
      "member.assign_layer",
      "invite.create",
      "activity.create",
      "notice.write",
      "post.moderate",
      "participant.contact",
      "participant.manage",
    ]);
  });

  it("sorts statuses into done, waiting and off tones", () => {
    expect(statusTone("confirmed")).toBe("done");
    expect(statusTone("pending_payment")).toBe("wait");
    expect(statusTone("refunded")).toBe("off");
    expect(statusTone("something_new")).toBe("off");
  });
});
