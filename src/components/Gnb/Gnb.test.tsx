import { render, screen, within } from "@testing-library/react";
import { NAV_ITEMS } from "@/lib/nav";
import { Gnb } from "./Gnb";

let pathname = "/clubs/weekend-vibe";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

describe("Gnb", () => {
  it("renders the five menus in the top bar and the tab bar", () => {
    pathname = "/explore";
    render(<Gnb />);
    const top = screen.getByRole("navigation", { name: "주 메뉴" });
    const tabs = screen.getByRole("navigation", { name: "하단 메뉴" });
    for (const item of NAV_ITEMS) {
      expect(within(top).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
      expect(within(tabs).getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });

  it("marks the current menu for nested paths, not home", () => {
    pathname = "/clubs/weekend-vibe";
    render(<Gnb />);
    const top = screen.getByRole("navigation", { name: "주 메뉴" });
    expect(within(top).getByRole("link", { name: "클럽" })).toHaveAttribute("aria-current", "page");
    expect(within(top).getByRole("link", { name: "홈" })).not.toHaveAttribute("aria-current");
  });

  it("hides the tab bar inside workbook lessons", () => {
    pathname = "/workbook/vibe-web";
    render(<Gnb />);
    expect(screen.queryByRole("navigation", { name: "하단 메뉴" })).toBeNull();
    const top = screen.getByRole("navigation", { name: "주 메뉴" });
    expect(within(top).getByRole("link", { name: "배우기" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
