import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("shows the label and a tone from the status", () => {
    render(<StatusBadge status="pending_payment" label="입금 대기" />);
    expect(screen.getByText("입금 대기")).toHaveAttribute("data-tone", "wait");
  });
});
