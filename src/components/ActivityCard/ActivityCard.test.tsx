import { render, screen } from "@testing-library/react";
import type { ActivityCardData } from "@/lib/platform/queries";
import { ActivityCard, whenText } from "./ActivityCard";

const NOW = new Date("2026-11-06T09:00:00Z"); // 11.6(금) 18:00 KST

const base: ActivityCardData = {
  id: "1",
  slug: "s",
  kind: "gathering",
  title: "오늘 저녁 모각코",
  summary: null,
  status: "open",
  startsAt: "2026-11-06T11:00:00Z",
  endsAt: "2026-11-06T13:00:00Z",
  cover: null,
  area: null,
  online: true,
  price: 0,
  capacity: 4,
  taken: 3,
  host: "주말 바이브코딩 클럽",
  lateJoin: false,
  sessions: null,
};

describe("ActivityCard", () => {
  it("종류·오늘 배지·남은 자리·무료가 보인다", () => {
    render(<ActivityCard activity={base} now={NOW} />);
    expect(screen.getByText("모임")).toBeInTheDocument();
    expect(screen.getByText("오늘")).toBeInTheDocument();
    expect(screen.getByText("오늘 · 오후 8:00")).toBeInTheDocument();
    expect(screen.getByText("1자리 남음")).toBeInTheDocument();
    expect(screen.getByText("무료")).toBeInTheDocument();
  });

  it("정원이 차면 대기 신청, 유료면 가격", () => {
    render(<ActivityCard activity={{ ...base, taken: 4, price: 15000 }} now={NOW} />);
    expect(screen.getByText("대기 신청 가능")).toBeInTheDocument();
    expect(screen.getByText("15,000원")).toBeInTheDocument();
  });

  it("진행 중인 시즌은 다음 회차와 합류 가능을 알린다", () => {
    const season: ActivityCardData = {
      ...base,
      kind: "series",
      status: "in_progress",
      startsAt: "2026-10-30T10:00:00Z",
      sessions: { count: 4, nextAt: "2026-11-13T10:30:00Z" },
    };
    render(<ActivityCard activity={season} now={NOW} />);
    expect(screen.getByText("진행 중 · 합류 가능")).toBeInTheDocument();
    expect(whenText(season, NOW)).toBe("다음 회차 11.13 (금) · 오후 7:30 · 4회");
  });

  it("표지가 없으면 제목으로 기본 표지를 그린다", () => {
    const { container } = render(<ActivityCard activity={base} now={NOW} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("상세 주소가 있을 때만 링크가 된다", () => {
    const { rerender } = render(<ActivityCard activity={base} now={NOW} />);
    expect(screen.queryByRole("link")).toBeNull();
    rerender(<ActivityCard activity={base} now={NOW} href="/activities/s" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/activities/s");
  });
});
