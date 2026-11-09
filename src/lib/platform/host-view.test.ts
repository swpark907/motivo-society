import { describe, expect, it } from "vitest";
import {
  countByTab,
  filterHostActivities,
  hostHref,
  hostTabOf,
  hostStatusLabel,
  hostTodos,
  parseHostFilters,
  seatText,
  type HostActivity,
} from "./host-view";

const NOW = new Date("2026-11-09T03:00:00Z");

function act(over: Partial<HostActivity>): HostActivity {
  return {
    id: "a",
    slug: "a",
    kind: "gathering",
    title: "모임",
    status: "open",
    startsAt: "2026-11-10T10:00:00Z",
    endsAt: "2026-11-10T12:00:00Z",
    clubId: null,
    clubName: null,
    capacity: null,
    price: 0,
    cover: null,
    confirmed: 0,
    waitlisted: 0,
    pendingApproval: 0,
    pendingPayment: 0,
    meetsToday: false,
    ...over,
  };
}

describe("호스트 활동 나누기", () => {
  it("취소 · 작성 중 · 끝남 · 끝난 시각이 지난 것은 지난 활동", () => {
    expect(hostTabOf(act({ status: "cancelled" }), NOW)).toBe("cancelled");
    expect(hostTabOf(act({ status: "draft", startsAt: null, endsAt: null }), NOW)).toBe("draft");
    expect(hostTabOf(act({ status: "ended" }), NOW)).toBe("past");
    expect(hostTabOf(act({ endsAt: "2026-11-08T00:00:00Z" }), NOW)).toBe("past");
    expect(hostTabOf(act({ status: "in_progress" }), NOW)).toBe("live");
  });

  it("탭별 개수", () => {
    const all = [
      act({ id: "1" }),
      act({ id: "2", status: "draft" }),
      act({ id: "3", status: "ended" }),
    ];
    expect(countByTab(all, NOW)).toEqual({ live: 1, draft: 1, past: 1, cancelled: 0 });
  });
});

describe("거르기와 주소", () => {
  it("모르는 값은 기본으로", () => {
    expect(parseHostFilters({ tab: "x", kind: "party", club: "1", q: "  카페 " })).toEqual({
      tab: "live",
      kind: null,
      club: null,
      q: "카페",
    });
  });

  it("기본값은 주소에 쓰지 않는다", () => {
    const f = parseHostFilters({});
    expect(hostHref(f)).toBe("/host");
    expect(hostHref(f, { tab: "past", q: "카페" })).toBe("/host?tab=past&q=%EC%B9%B4%ED%8E%98");
  });

  it("종류 · 검색으로 거르고, 지난 활동은 최근 순", () => {
    const all = [
      act({ id: "old", title: "카페 수다 1", status: "ended", startsAt: "2026-10-01T00:00:00Z" }),
      act({ id: "new", title: "카페 수다 2", status: "ended", startsAt: "2026-11-01T00:00:00Z" }),
      act({ id: "s", title: "시즌", kind: "series", status: "ended" }),
    ];
    const rows = filterHostActivities(
      all,
      { tab: "past", kind: "gathering", club: null, q: "카페" },
      NOW,
    );
    expect(rows.map((r) => r.id)).toEqual(["new", "old"]);
  });
});

describe("지금 처리할 일", () => {
  it("승인 대기 → 오늘 → 초안 → 입금 대기(알림), 지난 활동은 빼고", () => {
    const todos = hostTodos(
      [
        act({ id: "p", pendingPayment: 2 }),
        act({ id: "d", status: "draft" }),
        act({ id: "t", meetsToday: true, confirmed: 3 }),
        act({ id: "a", pendingApproval: 1 }),
        act({ id: "gone", status: "ended", pendingApproval: 4 }),
        act({
          id: "late",
          kind: "challenge",
          status: "in_progress",
          endsAt: "2026-11-08T15:00:00Z",
        }),
      ],
      NOW,
    );
    expect(todos.map((t) => [t.key, t.tone])).toEqual([
      ["approve-a", "act"],
      ["today-t", "act"],
      ["draft-d", "act"],
      ["wrap-late", "info"],
      ["pay-p", "info"],
    ]);
    expect(todos[1].title).toBe("오늘 열려요 · 확정 3명");
  });

  it("기간이 지났는데 열려 있으면 기간 끝남", () => {
    const labels = { in_progress: "진행 중", ended: "종료" };
    expect(
      hostStatusLabel(act({ status: "in_progress", endsAt: "2026-11-08T00:00:00Z" }), NOW, labels),
    ).toBe("기간 끝남");
    expect(hostStatusLabel(act({ status: "ended" }), NOW, labels)).toBe("종료");
    expect(hostStatusLabel(act({ status: "in_progress" }), NOW, labels)).toBe("진행 중");
  });

  it("자리 표시", () => {
    expect(seatText({ confirmed: 3, capacity: 5 })).toBe("3/5명");
    expect(seatText({ confirmed: 3, capacity: null })).toBe("3명");
  });
});
