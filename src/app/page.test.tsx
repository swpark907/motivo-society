import { render, screen } from "@testing-library/react";
import { NAV_ITEMS } from "@/lib/nav";
import Home from "./page";

describe("Home", () => {
  it("links to every top-level section", () => {
    render(<Home />);
    for (const item of NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }
  });
});
