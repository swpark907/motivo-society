import { render, screen } from "@testing-library/react";
import { ClubCard } from "./ClubCard";

describe("ClubCard", () => {
  it("shows members and how to join", () => {
    render(
      <ClubCard
        club={{
          id: "1",
          slug: "c",
          name: "주말 클럽",
          tagline: null,
          joinMode: "approval",
          members: 6,
        }}
      />,
    );
    expect(screen.getByText("멤버 6명 · 승인 후 가입")).toBeInTheDocument();
  });
});
