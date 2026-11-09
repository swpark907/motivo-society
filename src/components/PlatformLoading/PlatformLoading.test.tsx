import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlatformLoading } from "./PlatformLoading";

describe("PlatformLoading", () => {
  it("불러오는 중이라고 한 줄로 알린다", () => {
    render(<PlatformLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("불러오는 중이에요");
  });
});
