import { render, screen } from "@testing-library/react";
import { CapySays } from "./CapySays";

describe("CapySays", () => {
  it("says the line and keeps the picture decorative", () => {
    const { container } = render(<CapySays>중간에 들어와도 돼요.</CapySays>);
    expect(screen.getByText("중간에 들어와도 돼요.")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});
