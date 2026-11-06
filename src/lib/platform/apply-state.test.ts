import { describe, expect, it } from "vitest";
import { applyState, type ApplyInput } from "./apply-state";

const NOW = new Date("2026-11-06T09:00:00Z");
const base: ApplyInput = {
  status: "open",
  allowLateJoin: false,
  applyOpensAt: null,
  applyClosesAt: null,
  capacity: 6,
  taken: 2,
  price: 0,
  audience: "anyone",
  signedIn: true,
  isManager: false,
  isClubMember: null,
  hasEntitlement: null,
  mine: null,
};

const label = (patch: Partial<ApplyInput>) => applyState({ ...base, ...patch }, NOW).label;

describe("applyState", () => {
  it("비로그인은 로그인하고 신청", () => {
    expect(label({ signedIn: false })).toBe("로그인하고 신청");
  });

  it("자리가 있으면 신청, 차면 대기 신청, 진행 중 합류는 중간 합류", () => {
    expect(label({})).toBe("신청하기");
    expect(label({ taken: 6 })).toBe("대기 신청");
    expect(label({ status: "in_progress", allowLateJoin: true })).toBe("중간 합류 신청");
    expect(applyState({ ...base, price: 15000 }, NOW).note).toContain("입금이 확인되면");
  });

  it("내 신청 상태가 가장 먼저 보인다(마감·종료 뒤에도)", () => {
    expect(label({ mine: "confirmed", status: "ended" })).toBe("참가 확정");
    expect(label({ mine: "pending_payment" })).toBe("입금 기다리는 중");
    expect(label({ mine: "pending_approval" })).toBe("승인 기다리는 중");
    expect(label({ mine: "waitlisted" })).toBe("대기 신청됨");
  });

  it("끝남·취소·마감·신청 기간", () => {
    expect(label({ status: "ended" })).toBe("끝난 활동이에요");
    expect(label({ status: "cancelled" })).toBe("취소된 활동이에요");
    expect(label({ status: "closed" })).toBe("모집 마감");
    expect(label({ status: "in_progress" })).toBe("모집 마감");
    expect(label({ applyOpensAt: "2026-11-10T00:00:00Z" })).toBe("아직 신청 전이에요");
    expect(label({ applyClosesAt: "2026-11-01T00:00:00Z" })).toBe("신청 마감");
  });

  it("대상 제한과 여는 사람", () => {
    expect(label({ audience: "club_members", isClubMember: false })).toBe("클럽 멤버 전용");
    expect(label({ audience: "club_members", isClubMember: true })).toBe("신청하기");
    expect(label({ audience: "entitlement_holders", hasEntitlement: false })).toBe(
      "앞선 활동 참가자 전용",
    );
    expect(label({ isManager: true })).toBe("내가 여는 활동");
  });

  it("끝난 활동은 비로그인에게도 로그인을 권하지 않는다", () => {
    expect(label({ signedIn: false, status: "ended" })).toBe("끝난 활동이에요");
  });
});
