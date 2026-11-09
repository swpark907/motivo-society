import { describe, expect, it } from "vitest";
import { clubJoinState, facesLine } from "./club-state";

const base = { signedIn: true, joinMode: "open" as const, status: null, layerName: null };

describe("clubJoinState", () => {
  it("로그인 전에는 로그인부터, 승인제면 신청이라고", () => {
    expect(clubJoinState({ ...base, signedIn: false })).toMatchObject({
      kind: "login",
      label: "로그인하고 가입하기",
    });
    expect(clubJoinState({ ...base, signedIn: false, joinMode: "approval" }).label).toBe(
      "로그인하고 가입 신청",
    );
  });

  it("바로 가입 / 승인 신청", () => {
    expect(clubJoinState(base)).toMatchObject({ kind: "join", label: "가입하기", approval: false });
    expect(clubJoinState({ ...base, joinMode: "approval" })).toMatchObject({
      kind: "join",
      label: "가입 신청하기",
      approval: true,
    });
  });

  it("멤버·대기·강퇴·나감", () => {
    expect(clubJoinState({ ...base, status: "active", layerName: "멤버" }).label).toBe("멤버예요");
    expect(clubJoinState({ ...base, status: "active", layerName: "운영진" }).label).toBe(
      "멤버 · 운영진",
    );
    expect(clubJoinState({ ...base, status: "pending" }).label).toBe("운영진 승인 대기");
    expect(clubJoinState({ ...base, status: "banned" }).kind).toBe("banned");
    expect(clubJoinState({ ...base, status: "left" })).toMatchObject({
      kind: "join",
      note: "전에 나간 클럽이에요. 다시 가입할 수 있어요.",
    });
  });
});

describe("facesLine", () => {
  it("앞의 몇 명만, 나머지는 숫자", () => {
    expect(facesLine(["a", "b", "c"], 2)).toEqual({ shown: ["a", "b"], rest: 1 });
    expect(facesLine(["a"], 2)).toEqual({ shown: ["a"], rest: 0 });
  });
});
