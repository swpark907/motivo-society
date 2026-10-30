import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { emptyProjectProgress } from "@/lib/workbook-project-progress";
import { emptyApplications } from "@/lib/workbook-application";
import { WorkbookCompletionSummary } from "./WorkbookCompletionSummary";

const fixture = vi.hoisted(() => ({ current: {} }));
vi.mock("./WorkbookProgressContext", () => ({ useWorkbookProgress: () => fixture.current }));
beforeEach(() => {
  fixture.current = {
    projectWorkflow: emptyProjectProgress(),
    project: {
      title: "내 페이지",
      audience: "친구",
      purpose: "소개",
      intro: "소개글",
      content: "작업",
    },
    applications: emptyApplications(),
    publish: { actual: "연습용 버튼이 열리지 않음", comparison: "수정된 예시 버튼 확인" },
  };
});
it("예시 단원 요약을 실제 공개 결과로 표현하지 않는다", () => {
  render(<WorkbookCompletionSummary stage="publish" />);
  expect(screen.getByText("학습 예시에서 확인한 결과")).toBeInTheDocument();
  expect(screen.queryByText(/내 파일에서 확인한 결과/)).not.toBeInTheDocument();
});
it("이전 적용 확인은 보존하되 현재 실제 목표로 승격하지 않는다", () => {
  const record = fixture.current as { applications: ReturnType<typeof emptyApplications> };
  record.applications.publish = {
    ...record.applications.publish,
    mode: "applied",
    confirmed: true,
    result: "이전에 공개했다고 적은 기록",
  };
  render(<WorkbookCompletionSummary stage="publish" />);
  expect(screen.getByText(/이전 양식의 적용 기록/)).toHaveTextContent(
    "이전에 공개했다고 적은 기록",
  );
  expect(screen.getByText(/현재 실제 목표와 최종 공개 완료 판정은 별도/)).toBeInTheDocument();
  expect(screen.queryByText(/내 파일에서 확인한 결과/)).not.toBeInTheDocument();
});
