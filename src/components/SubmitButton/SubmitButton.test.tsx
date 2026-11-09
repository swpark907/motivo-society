import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubmitButton } from "./SubmitButton";

describe("SubmitButton", () => {
  it("처리 전에는 평소 문구로 눌린다", () => {
    render(
      <form>
        <SubmitButton pendingLabel="가입하는 중…">가입하기</SubmitButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "가입하기" });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("type", "submit");
  });
});
