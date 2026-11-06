// 활동 상세의 신청 버튼 상태. 같은 판단을 넓은 화면 신청 카드와 모바일 하단 바가 함께 쓴다.
// React 의존 없음. 실제 허용 여부는 DB 함수(participation_apply)가 다시 판단한다.

export type MyParticipation =
  "pending_approval" | "pending_payment" | "waitlisted" | "confirmed" | null;

export type ApplyInput = {
  status: string; // activities.status
  allowLateJoin: boolean;
  applyOpensAt: string | null;
  applyClosesAt: string | null;
  capacity: number | null;
  taken: number;
  price: number;
  audience: "anyone" | "club_members" | "entitlement_holders";
  signedIn: boolean;
  isManager: boolean;
  /** 클럽 멤버 전용일 때 멤버인지(아니면 null). */
  isClubMember: boolean | null;
  /** 이용권 보유자 전용일 때 가지고 있는지(아니면 null). */
  hasEntitlement: boolean | null;
  mine: MyParticipation;
};

export type ApplyState =
  | { kind: "login"; label: string; note: string }
  | { kind: "apply"; label: string; note: string; waitlist: boolean }
  | { kind: "mine"; label: string; note: string; status: Exclude<MyParticipation, null> }
  | { kind: "blocked"; label: string; note: string; reason: string };

const SHORT = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function applyState(a: ApplyInput, now: Date): ApplyState {
  // 이미 신청한 사람에게는 자기 상태가 먼저다(마감 뒤에도).
  if (a.mine === "confirmed") {
    return {
      kind: "mine",
      status: a.mine,
      label: "참가 확정",
      note: "참가 정보는 아래에서 확인해요.",
    };
  }
  if (a.mine === "pending_payment") {
    return {
      kind: "mine",
      status: a.mine,
      label: "입금 기다리는 중",
      note: "입금이 확인되면 참가가 확정돼요.",
    };
  }
  if (a.mine === "pending_approval") {
    return {
      kind: "mine",
      status: a.mine,
      label: "승인 기다리는 중",
      note: "여는 사람이 확인하면 알려 드려요.",
    };
  }
  if (a.mine === "waitlisted") {
    return {
      kind: "mine",
      status: a.mine,
      label: "대기 신청됨",
      note: "자리가 나면 먼저 신청한 순서대로 확정돼요.",
    };
  }

  if (a.status === "ended" || a.status === "cancelled") {
    const label = a.status === "ended" ? "끝난 활동이에요" : "취소된 활동이에요";
    return { kind: "blocked", reason: a.status, label, note: "발견에서 다른 활동을 찾아보세요." };
  }
  if (a.isManager) {
    return {
      kind: "blocked",
      reason: "manager",
      label: "내가 여는 활동",
      note: "참가자 관리는 호스트 도구에서 해요.",
    };
  }
  const lateJoin = a.status === "in_progress" && a.allowLateJoin;
  if (a.status === "closed" || (a.status === "in_progress" && !a.allowLateJoin)) {
    return {
      kind: "blocked",
      reason: "closed",
      label: "모집 마감",
      note: "다음에 열리면 발견에 다시 보여요.",
    };
  }
  if (a.applyOpensAt && now < new Date(a.applyOpensAt)) {
    return {
      kind: "blocked",
      reason: "not_open_yet",
      label: "아직 신청 전이에요",
      note: `${SHORT.format(new Date(a.applyOpensAt))}부터 신청할 수 있어요.`,
    };
  }
  if (a.applyClosesAt && now > new Date(a.applyClosesAt)) {
    return {
      kind: "blocked",
      reason: "apply_closed",
      label: "신청 마감",
      note: "신청 기간이 끝났어요.",
    };
  }

  if (!a.signedIn) {
    return {
      kind: "login",
      label: "로그인하고 신청",
      note: "이메일로 바로 가입·로그인할 수 있어요.",
    };
  }
  if (a.audience === "club_members" && a.isClubMember === false) {
    return {
      kind: "blocked",
      reason: "members_only",
      label: "클럽 멤버 전용",
      note: "클럽에 가입한 사람만 신청할 수 있어요.",
    };
  }
  if (a.audience === "entitlement_holders" && a.hasEntitlement === false) {
    return {
      kind: "blocked",
      reason: "entitlement_required",
      label: "앞선 활동 참가자 전용",
      note: "연결된 활동에 참가한 사람만 신청할 수 있어요.",
    };
  }

  const full = a.capacity !== null && a.taken >= a.capacity;
  if (full) {
    return {
      kind: "apply",
      waitlist: true,
      label: "대기 신청",
      note: "자리가 나면 순서대로 확정돼요.",
    };
  }
  const left = a.capacity === null ? null : a.capacity - a.taken;
  const seats = left === null ? "" : `${left}자리 남았어요. `;
  return {
    kind: "apply",
    waitlist: false,
    label: lateJoin ? "중간 합류 신청" : "신청하기",
    note: a.price > 0 ? `${seats}입금이 확인되면 확정돼요.` : `${seats}신청하면 바로 확정돼요.`,
  };
}
