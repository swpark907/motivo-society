import { describe, expect, it } from "vitest";
import {
  attendanceCounts,
  csvCell,
  rosterCsv,
  rosterFileName,
  canCheckAttendance,
  groupRoster,
  manageActions,
  moneySummary,
  orderBadge,
  progressText,
  type MoneyOrder,
  type RosterRow,
} from "./host-activity-view";

function row(over: Partial<RosterRow>): RosterRow {
  return {
    participationId: "p",
    userId: "u",
    nickname: "가",
    status: "confirmed",
    appliedAt: "2026-11-01T00:00:00Z",
    orderNo: null,
    orderStatus: null,
    orderDueAt: null,
    attendance: null,
    seasonAttended: null,
    seasonHeld: null,
    accepted: null,
    outcome: null,
    ...over,
  };
}

describe("명단 묶기", () => {
  it("승인 대기가 먼저, 빈 묶음은 빼고, 확정은 이름순 · 나머지는 신청순", () => {
    const groups = groupRoster([
      row({ participationId: "c2", nickname: "하나" }),
      row({ participationId: "c1", nickname: "가람" }),
      row({ participationId: "w2", status: "waitlisted", appliedAt: "2026-11-03T00:00:00Z" }),
      row({ participationId: "w1", status: "waitlisted", appliedAt: "2026-11-02T00:00:00Z" }),
      row({ participationId: "a", status: "pending_approval" }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(["승인 대기", "확정", "대기"]);
    expect(groups[1].rows.map((r) => r.participationId)).toEqual(["c1", "c2"]);
    expect(groups[2].rows.map((r) => r.participationId)).toEqual(["w1", "w2"]);
  });
});

describe("출석", () => {
  it("시작 1시간 전부터 체크할 수 있다", () => {
    const starts = "2026-11-09T10:00:00Z";
    expect(canCheckAttendance(starts, new Date("2026-11-09T08:59:00Z"))).toBe(false);
    expect(canCheckAttendance(starts, new Date("2026-11-09T09:00:00Z"))).toBe(true);
    expect(canCheckAttendance(null, new Date())).toBe(false);
  });

  it("확정된 사람만 센다", () => {
    expect(
      attendanceCounts([
        row({ attendance: "attended" }),
        row({ attendance: "absent" }),
        row({}),
        row({ status: "cancelled", attendance: "attended" }),
      ]),
    ).toEqual({ attended: 1, absent: 1, unchecked: 1 });
  });
});

describe("받은 돈", () => {
  const order = (over: Partial<MoneyOrder>): MoneyOrder => ({
    orderNo: "MS-1",
    nickname: "가",
    amount: 10000,
    status: "paid",
    createdAt: "2026-11-01T00:00:00Z",
    dueAt: "2026-11-10T00:00:00Z",
    refunds: [],
    ...over,
  });

  const NOW = new Date("2026-11-09T03:00:00Z");

  it("입금 확인된 주문 − 송금 끝난 환불, 처리 중 환불과 입금 대기는 따로", () => {
    expect(
      moneySummary(
        [
          order({}),
          order({ status: "partially_refunded", refunds: [{ amount: 5000, status: "paid" }] }),
          order({ refunds: [{ amount: 3000, status: "requested" }] }),
          order({ status: "pending", amount: 7000 }),
          order({ status: "expired" }),
          order({ refunds: [{ amount: 9000, status: "rejected" }] }),
          order({ status: "pending", amount: 9999, dueAt: "2026-11-09T02:00:00Z" }),
        ],
        NOW,
      ),
    ).toEqual({ received: 40000, refunded: 5000, refundOpen: 3000, pending: 7000 });
  });

  it("기한이 지난 입금 대기는 기한 지남", () => {
    const labels = { pending: "입금 대기", paid: "결제 완료" };
    expect(
      orderBadge(order({ status: "pending", dueAt: "2026-11-09T02:00:00Z" }), NOW, labels),
    ).toEqual({ status: "expired", label: "기한 지남" });
    expect(orderBadge(order({ status: "pending" }), NOW, labels).label).toBe("입금 대기");
    expect(orderBadge(order({}), NOW, labels).label).toBe("결제 완료");
  });
});

describe("쓸 수 있는 동작", () => {
  const NOW = new Date("2026-11-09T03:00:00Z");
  const base = {
    kind: "gathering",
    status: "open" as const,
    startsAt: "2026-11-10T00:00:00Z",
    endsAt: "2026-11-10T02:00:00Z",
    isSession: false,
  };

  it("초안은 공개하기, 회차 초안은 시즌을 따른다", () => {
    expect(manageActions({ ...base, status: "draft" }, NOW)).toEqual({
      publish: true,
      finalize: false,
      viewPublic: false,
    });
    expect(manageActions({ ...base, status: "draft", isSession: true }, NOW).publish).toBe(false);
    expect(manageActions(base, NOW).viewPublic).toBe(true);
  });

  it("기간이 끝난 챌린지만 완주 판정, 이미 끝냈으면 없음", () => {
    const chal = {
      ...base,
      kind: "challenge",
      status: "in_progress" as const,
      endsAt: "2026-11-08T15:00:00Z",
    };
    expect(manageActions(chal, NOW).finalize).toBe(true);
    expect(manageActions({ ...chal, status: "ended" }, NOW).finalize).toBe(false);
    expect(manageActions({ ...chal, endsAt: "2026-11-12T15:00:00Z" }, NOW).finalize).toBe(false);
  });
});

describe("진행 표시", () => {
  it("시즌 출석 · 챌린지 인증과 판정", () => {
    expect(progressText(row({ seasonAttended: 1, seasonHeld: 2 }), null)).toBe("출석 1/2회");
    expect(progressText(row({ seasonAttended: 0, seasonHeld: 0 }), null)).toBe(
      "아직 열린 회차 없음",
    );
    expect(progressText(row({ accepted: 6, outcome: "completed" }), 5)).toBe("인증 6/5회 · 완주");
    expect(progressText(row({ accepted: 3 }), 5)).toBe("인증 3/5회");
    expect(progressText(row({}), null)).toBeNull();
  });
});

describe("명단 내보내기", () => {
  it("CSV 칸: 따옴표·쉼표를 감싸고 수식으로 시작하면 막는다", () => {
    expect(csvCell("가람")).toBe("가람");
    expect(csvCell('말 "따옴표", 쉼표')).toBe('"말 ""따옴표"", 쉼표"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell(null)).toBe("");
  });

  it("모임 명단: BOM · 머리줄 · 상태 순서 · 출석, 이메일 같은 칸은 없다", () => {
    const csv = rosterCsv(
      "gathering",
      [
        row({ nickname: "하나", attendance: "attended", appliedAt: "2026-11-01T16:00:00Z" }),
        row({ nickname: "둘", status: "pending_payment", orderNo: "MS-1", orderStatus: "pending" }),
      ],
      { pending: "입금 대기" },
      null,
    );
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const lines = csv.slice(1).trimEnd().split("\r\n");
    expect(lines[0]).toBe("닉네임,상태,신청일,결제,주문 번호,출석");
    expect(lines[1]).toBe("둘,입금 대기,2026-11-01,입금 대기,MS-1,");
    expect(lines[2]).toBe("하나,확정,2026-11-02,,,참석");
  });

  it("챌린지는 인증과 완주, 파일 이름은 쓸 수 없는 글자를 뺀다", () => {
    const csv = rosterCsv("challenge", [row({ accepted: 6, outcome: "completed" })], {}, 5);
    expect(csv).toContain("인정된 인증,완주");
    expect(csv).toContain("6/5,완주");
    expect(rosterFileName('1주/프롬프트:"일기"', new Date("2026-11-09T03:00:00Z"))).toBe(
      "명단-1주 프롬프트 일기-2026-11-09.csv",
    );
  });
});
