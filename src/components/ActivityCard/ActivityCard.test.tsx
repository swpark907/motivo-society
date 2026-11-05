import { render, screen } from "@testing-library/react";
import type { ActivityCardData } from "@/lib/platform/queries";
import { ActivityCard } from "./ActivityCard";

const base: ActivityCardData = {
  id: "1",
  slug: "s",
  kind: "gathering",
  title: "오늘 저녁 모각코",
  summary: null,
  status: "open",
  startsAt: "2026-11-05T11:00:00Z",
  area: null,
  online: true,
  price: 0,
  capacity: 4,
  taken: 3,
  host: "주말 바이브코딩 클럽",
  lateJoin: false,
};

describe("ActivityCard", () => {
  it("shows kind, price and seats left", () => {
    render(<ActivityCard activity={base} />);
    expect(screen.getByText("모임")).toBeInTheDocument();
    expect(screen.getByText(/무료 · 1자리 남음/)).toBeInTheDocument();
  });

  it("says a full activity can still take a waitlist", () => {
    render(<ActivityCard activity={{ ...base, taken: 4, price: 15000 }} />);
    expect(screen.getByText(/15,000원 · 대기 신청 가능/)).toBeInTheDocument();
  });

  it("links only when a destination is given", () => {
    const { rerender } = render(<ActivityCard activity={base} />);
    expect(screen.queryByRole("link")).toBeNull();
    rerender(<ActivityCard activity={base} href="/activities/s" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/activities/s");
  });
});
