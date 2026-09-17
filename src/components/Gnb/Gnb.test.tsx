import { render, screen } from "@testing-library/react";
import { NAV_ITEMS } from "@/lib/nav";
import { Gnb } from "./Gnb";

vi.mock("next/navigation", () => ({ usePathname: () => "/library/skills" }));

describe("Gnb", () => {
  it("renders every top-level menu item", () => {
    render(<Gnb />);
    for (const item of NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }
  });

  it("marks the current section active, including nested paths", () => {
    render(<Gnb />);
    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Article" })).not.toHaveAttribute("aria-current");
  });
});
