import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CapyLoading } from "./CapyLoading";

describe("CapyLoading", () => {
  it("화면 읽기에는 불러오는 중이라고 한 줄로 알리고, 글자 애니메이션은 숨긴다", () => {
    render(<CapyLoading scene="car" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("불러오는 중이에요");
    expect(status.querySelector("[aria-hidden='true']")).toHaveTextContent("LOADING");
  });
});
