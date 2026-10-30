import { describe, it, expect } from "vitest";
import {
  workbookCurriculum,
  workbookCurriculumStages,
  workbookPointTopics,
} from "./workbook-curriculum";
import { practicalLabs, practicalMapStops } from "./workbook-practical-labs";

describe("커리큘럼과 실제 지도 지점의 대응", () => {
  it("소개 주제가 빠지거나 중복되지 않고 각 단원의 기본 지점에 연결된다", () => {
    for (const [unit, stage] of workbookCurriculumStages.entries()) {
      const topics = workbookPointTopics[stage].flat().sort((a, b) => a - b);
      expect(topics).toEqual(workbookCurriculum[unit].lessons.map((_, index) => index));
      expect(workbookPointTopics[stage]).toHaveLength(stage === "agent" ? 5 : 3);
    }
  });
  it("단원마다 독립 심화 장소와 실제 상황 활동이 대응한다", () => {
    for (const stage of workbookCurriculumStages) {
      expect(practicalMapStops[stage].name.trim()).not.toBe("");
      expect(practicalLabs[stage].situations.length).toBeGreaterThan(0);
      const end = practicalMapStops[stage].path.split(" ").at(-1);
      expect(end).toBe(`${practicalMapStops[stage].x},${practicalMapStops[stage].y}`);
    }
  });
});
