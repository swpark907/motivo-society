import { fireEvent, render, screen } from "@testing-library/react";
import { WorkbookIntroSprite } from "./WorkbookIntroSprite";

// jsdom에는 matchMedia와 캔버스 그리기가 없다. 그림은 검증하지 않고 재생 상태만 본다.
function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: reduce && query.includes("reduce"),
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WorkbookIntroSprite", () => {
  it("starts still when the reader prefers reduced motion", () => {
    mockReducedMotion(true);
    render(<WorkbookIntroSprite />);
    expect(screen.getByRole("button", { name: "움직임 보기" })).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAccessibleName(
      "선글라스를 쓴 카피바라가 책상에 앉아 노트북으로 공부하는 모습",
    );
  });

  it("plays by default and can be stopped", () => {
    mockReducedMotion(false);
    render(<WorkbookIntroSprite />);
    fireEvent.click(screen.getByRole("button", { name: "움직임 멈추기" }));
    expect(screen.getByRole("button", { name: "움직임 보기" })).toBeInTheDocument();
  });

  it("replays from the start even after reduced motion stopped it", () => {
    mockReducedMotion(true);
    render(<WorkbookIntroSprite />);
    fireEvent.click(screen.getByRole("button", { name: "처음부터 보기" }));
    expect(screen.getByRole("button", { name: "움직임 멈추기" })).toBeInTheDocument();
  });
});
