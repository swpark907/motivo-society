import { render, screen } from "@testing-library/react";
import { PlatformPage } from "./PlatformPage";

describe("PlatformPage", () => {
  it("renders a paper main with the page heading", () => {
    render(
      <PlatformPage label="EXPLORE" title="둘러보기">
        <p>본문</p>
      </PlatformPage>,
    );
    expect(screen.getByRole("main")).toHaveClass("paper");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("둘러보기");
  });
});
