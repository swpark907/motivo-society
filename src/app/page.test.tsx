import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the hero and the Yard / Library sections", async () => {
    render(await Home());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("배우고");
    expect(screen.getByRole("list", { name: "Yard" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI\s*활용법/ })).toHaveAttribute(
      "href",
      "/library#ai",
    );
  });
});
