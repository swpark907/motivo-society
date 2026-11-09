// 클럽 화면의 가입 상태 → 버튼과 안내. React·DB 의존 없음.

export type MemberStatus = "active" | "pending" | "left" | "banned" | null;

export type ClubJoinState =
  | { kind: "login"; label: string; note: string }
  | { kind: "join"; label: string; note: string; approval: boolean }
  | { kind: "member"; label: string; note: string }
  | { kind: "pending"; label: string; note: string }
  | { kind: "banned"; label: string; note: string };

export function clubJoinState(input: {
  signedIn: boolean;
  joinMode: "open" | "approval";
  status: MemberStatus;
  layerName: string | null;
}): ClubJoinState {
  const approval = input.joinMode === "approval";
  if (!input.signedIn) {
    return {
      kind: "login",
      label: approval ? "로그인하고 가입 신청" : "로그인하고 가입하기",
      note: approval ? "운영진이 승인하면 멤버가 돼요." : "가입하면 바로 멤버가 돼요.",
    };
  }
  if (input.status === "active") {
    return {
      kind: "member",
      label:
        input.layerName && input.layerName !== "멤버" ? `멤버 · ${input.layerName}` : "멤버예요",
      note: "멤버 전용 모임에도 신청할 수 있어요.",
    };
  }
  if (input.status === "pending") {
    return {
      kind: "pending",
      label: "운영진 승인 대기",
      note: "가입을 신청했어요. 운영진이 승인하면 멤버가 돼요.",
    };
  }
  if (input.status === "banned") {
    return {
      kind: "banned",
      label: "가입할 수 없어요",
      note: "이 클럽에서 내보내져 다시 가입할 수 없어요.",
    };
  }
  return {
    kind: "join",
    approval,
    label: approval ? "가입 신청하기" : "가입하기",
    note:
      input.status === "left"
        ? "전에 나간 클럽이에요. 다시 가입할 수 있어요."
        : approval
          ? "운영진이 승인하면 멤버가 돼요."
          : "가입하면 바로 멤버가 돼요.",
  };
}

/** "외 n명" 얼굴 줄: 앞의 max명만 보이고 나머지는 숫자로. */
export function facesLine(names: string[], max = 8): { shown: string[]; rest: number } {
  return { shown: names.slice(0, max), rest: Math.max(0, names.length - max) };
}
