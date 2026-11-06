import { render, screen } from "@testing-library/react";
import { PublicHome } from "./PublicHome";

// 연결 정보가 없는 환경(단위 테스트·CI)에서는 활동 줄이 빠지고 히어로와 Library만 남는다.
describe("PublicHome", () => {
  it("renders the hero and the Library section", async () => {
    render(await PublicHome());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("배우고");
    expect(screen.queryByRole("list", { name: "이번 주 활동" })).toBeNull();
    expect(screen.getByRole("list", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI\s*활용법/ })).toHaveAttribute(
      "href",
      "/library#ai",
    );
  });
});
