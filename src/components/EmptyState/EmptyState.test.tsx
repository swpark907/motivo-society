import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("offers the next action", () => {
    render(<EmptyState title="아직 없어요" action={{ href: "/explore", label: "둘러보기" }} />);
    expect(screen.getByRole("link", { name: "둘러보기" })).toHaveAttribute("href", "/explore");
  });
});
