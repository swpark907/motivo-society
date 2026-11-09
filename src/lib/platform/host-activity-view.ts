// 호스트 활동 관리 화면(/host/activities/[id])의 계산: 명단 묶기 · 출석 시각 · 받은 돈 요약 · 쓸 수 있는 동작.
// React·DB 의존 없음.
import { hostTabOf, type HostActivityStatus } from "./host-view";

export type ParticipationStatus =
  "pending_approval" | "pending_payment" | "waitlisted" | "confirmed" | "cancelled";

export type RosterRow = {
  participationId: string;
  userId: string;
  nickname: string;
  status: ParticipationStatus;
  appliedAt: string;
  orderNo: string | null;
  orderStatus: string | null;
  orderDueAt: string | null;
  /** 모임·회차: 이 모임의 출석 */
  attendance: "attended" | "absent" | null;
  /** 시즌: 이미 열린 회차 중 참석한 수 / 열린 회차 수 */
  seasonAttended: number | null;
  seasonHeld: number | null;
  /** 챌린지: 인정된 인증 수 · 판정 결과 */
  accepted: number | null;
  outcome: "completed" | "incomplete" | null;
};

const GROUPS: { status: ParticipationStatus; label: string }[] = [
  { status: "pending_approval", label: "승인 대기" },
  { status: "pending_payment", label: "입금 대기" },
  { status: "confirmed", label: "확정" },
  { status: "waitlisted", label: "대기" },
  { status: "cancelled", label: "취소" },
];

export type RosterGroup = { status: ParticipationStatus; label: string; rows: RosterRow[] };

/** 상태별로 묶는다. 할 일이 있는 묶음(승인 대기)이 먼저, 빈 묶음은 뺀다. 확정은 이름순, 나머지는 신청순. */
export function groupRoster(rows: RosterRow[]): RosterGroup[] {
  return GROUPS.map((g) => {
    const list = rows.filter((r) => r.status === g.status);
    list.sort((x, y) =>
      g.status === "confirmed"
        ? x.nickname.localeCompare(y.nickname, "ko")
        : x.appliedAt.localeCompare(y.appliedAt),
    );
    return { ...g, rows: list };
  }).filter((g) => g.rows.length > 0);
}

/** 출석은 시작 1시간 전부터 체크한다(DB attendance_mark와 같은 기준). */
export function attendanceOpensAt(startsAt: string): Date {
  return new Date(new Date(startsAt).getTime() - 60 * 60 * 1000);
}

export function canCheckAttendance(startsAt: string | null, now: Date): boolean {
  return startsAt !== null && now.getTime() >= attendanceOpensAt(startsAt).getTime();
}

export function attendanceCounts(rows: RosterRow[]): {
  attended: number;
  absent: number;
  unchecked: number;
} {
  const confirmed = rows.filter((r) => r.status === "confirmed");
  const attended = confirmed.filter((r) => r.attendance === "attended").length;
  const absent = confirmed.filter((r) => r.attendance === "absent").length;
  return { attended, absent, unchecked: confirmed.length - attended - absent };
}

export type MoneyOrder = {
  orderNo: string;
  nickname: string;
  amount: number;
  status: string;
  createdAt: string;
  /** 입금 기한. 지났는데 아직 pending이면 운영진이 만료 처리하기 전이다. */
  dueAt: string;
  refunds: { amount: number; status: string }[];
};

const RECEIVED = new Set(["paid", "refunded", "partially_refunded"]);

function overdue(o: Pick<MoneyOrder, "status" | "dueAt">, now: Date): boolean {
  return o.status === "pending" && new Date(o.dueAt).getTime() < now.getTime();
}

/** 주문 배지: 기한이 지난 입금 대기는 "기한 지남"(끝남 모양). */
export function orderBadge(
  o: Pick<MoneyOrder, "status" | "dueAt">,
  now: Date,
  labels: Record<string, string>,
): { status: string; label: string } {
  return overdue(o, now)
    ? { status: "expired", label: "기한 지남" }
    : { status: o.status, label: labels[o.status] ?? o.status };
}

/**
 * 주문에서 계산한 돈. 받은 돈 = 입금 확인된 주문 합계, 돌려준 돈 = 송금 끝난 환불 합계.
 * 처리 중 환불(요청·승인)과 입금 대기는 따로 보여 준다. 기한이 지난 입금 대기는 들어올 돈으로 세지 않는다.
 * 수수료·정산은 이 화면에서 계산하지 않는다.
 */
export function moneySummary(
  orders: MoneyOrder[],
  now: Date,
): {
  received: number;
  refunded: number;
  refundOpen: number;
  pending: number;
  net: number;
} {
  let received = 0;
  let refunded = 0;
  let refundOpen = 0;
  let pending = 0;
  for (const o of orders) {
    if (RECEIVED.has(o.status)) received += o.amount;
    if (o.status === "pending" && !overdue(o, now)) pending += o.amount;
    for (const r of o.refunds) {
      if (r.status === "paid") refunded += r.amount;
      if (r.status === "requested" || r.status === "approved") refundOpen += r.amount;
    }
  }
  return { received, refunded, refundOpen, pending, net: received - refunded };
}

export type ManageActions = {
  /** 초안이면 공개하기(회차는 시즌을 따라가서 따로 공개하지 않는다) */
  publish: boolean;
  /** 기간이 끝난 챌린지의 완주 판정 */
  finalize: boolean;
  /** 공개된 활동이면 참가자 화면 보기 */
  viewPublic: boolean;
};

export function manageActions(
  a: {
    kind: string;
    status: HostActivityStatus;
    startsAt: string | null;
    endsAt: string | null;
    isSession: boolean;
  },
  now: Date,
): ManageActions {
  const ended = a.status === "ended" || a.status === "cancelled";
  return {
    publish: a.status === "draft" && !a.isSession,
    finalize: a.kind === "challenge" && !ended && hostTabOf(a, now) === "past",
    viewPublic: a.status !== "draft",
  };
}

/** 명단 한 줄의 진행 표시: 시즌 출석 · 챌린지 인증. 없으면 null. */
export function progressText(r: RosterRow, threshold: number | null): string | null {
  if (r.seasonHeld !== null && r.seasonAttended !== null) {
    return r.seasonHeld === 0
      ? "아직 열린 회차 없음"
      : `출석 ${r.seasonAttended}/${r.seasonHeld}회`;
  }
  if (r.accepted !== null) {
    const base = threshold ? `인증 ${r.accepted}/${threshold}회` : `인증 ${r.accepted}회`;
    if (r.outcome === "completed") return `${base} · 완주`;
    if (r.outcome === "incomplete") return `${base} · 미완주`;
    return base;
  }
  return null;
}
