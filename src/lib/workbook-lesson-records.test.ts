import { describe, expect, it } from "vitest";
import { workbookCourse, workbookLessonId } from "./workbook-course";
import { canOpenWorkbookUnit, workbookTrialAccess } from "./workbook-access";
import {
  isUnitOneDone,
  toWorkbookLessonRows,
  unitOneLessonSlug,
  unitOneRemaining,
} from "./workbook-lesson-records";

const emptyPlan = {
  title: "",
  audience: "",
  purpose: "",
  intro: "",
  content: "",
  later: "",
  request: "",
  mode: null,
  observation: "",
};

describe("workbook lesson records", () => {
  it("1단원 순번을 수업 이름으로 바꾼다", () => {
    expect(unitOneLessonSlug(workbookLessonId.firstFile)).toBe("first-file");
    expect(unitOneLessonSlug(99)).toBeNull();
  });

  it("수업마다 한 행을 만들고, 학습자가 쓴 칸만 담는다", () => {
    const rows = toWorkbookLessonRows({
      completed: [0, workbookLessonId.firstFile],
      practice: {
        [workbookLessonId.firstFile]: {
          mode: "computer",
          request: "index.html 파일을 하나 만들어줘.",
          observation: " 제목이 보였어요 ",
          revision: "",
        },
      },
      project: { ...emptyPlan, audience: "채용 담당자", later: "작업 캡처" },
      projectDone: [false, false, false],
    });
    const total = workbookCourse[0].lessons.length + workbookCourse[1].lessons.length;
    expect(rows).toHaveLength(total);
    const file = rows.find((row) => row.lesson === "first-file")!;
    expect(file).toMatchObject({ status: "done", mode: "computer" });
    expect(file.fields).toEqual({
      request: "index.html 파일을 하나 만들어줘.",
      observation: "제목이 보였어요",
    });
    const planning = rows.find((row) => row.lesson === "page-planning")!;
    expect(planning).toMatchObject({ status: "in-progress", mode: null });
    expect(planning.fields).toEqual({ audience: "채용 담당자", later: "작업 캡처" });
    expect(rows.find((row) => row.lesson === "ai-tools")!.status).toBe("unstarted");
  });

  it("지금 마치는 수업까지 셈해 1단원 완료와 남은 수업을 알려 준다", () => {
    const allButLast = workbookCourse[0].lessons.map((_, index) => index).slice(0, -1);
    expect(isUnitOneDone(allButLast)).toBe(false);
    expect(isUnitOneDone(allButLast, workbookLessonId.firstFile)).toBe(true);
    expect(unitOneRemaining([0, 1], workbookLessonId.firstFile).map((l) => l.slug)).toEqual([
      "ai-usage",
      "tool-setup",
      "first-request",
    ]);
  });

  it("무료 체험에서는 모든 단원이 열리고, 단원 목록 권한은 그 단원만 연다", () => {
    expect(canOpenWorkbookUnit(workbookTrialAccess, 2)).toBe(true);
    expect(canOpenWorkbookUnit({ kind: "units", units: [1] }, 2)).toBe(false);
    expect(canOpenWorkbookUnit({ kind: "units", units: [1, 2] }, 2)).toBe(true);
  });
});
