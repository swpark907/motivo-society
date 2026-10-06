import { describe, expect, it } from "vitest";
import { readProgress } from "./workbook-journey";
describe("브라우저 여정 기록 복원", () => {
  it("손상된 데이터로 학습이 막히지 않는다", () => {
    for (const raw of [null, "bad", "null", "[]", '{"completed":-2,"chapter":99}']) {
      expect(readProgress(raw)).toEqual({ chapter: 0, completed: 0, note: "", applied: false });
    }
  });
  it("진행보다 앞선 장소와 미완료 적용 표시는 복원하지 않는다", () => {
    expect(
      readProgress(JSON.stringify({ chapter: 2, completed: 1, applied: true, note: "발견" })),
    ).toEqual({ chapter: 1, completed: 1, applied: false, note: "발견" });
  });
});
