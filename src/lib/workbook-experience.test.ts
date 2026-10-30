import { expect, it } from "vitest";
import { emptyExperience, emptyOwnExperience, experienceProgress } from "./workbook-experience";
it("기본 화면 실습은 이전의 개선·유지 이유를 요구하지 않는다", () => {
  const own = emptyOwnExperience();
  const record = {
    ...emptyExperience(),
    mode: "computer" as const,
    own,
    before: [true, true],
    observation: "예시 관찰",
    request: "예시 너비 요청",
    applied: true,
    after: [true, true],
    buttonChecked: true,
    comparison: "전후 확인",
  };
  expect(experienceProgress(record).verified).toBe(true);
  expect(record.own).toBe(own);
});
it("기본 화면 실습의 두 화면 관찰과 비교 조건은 보존한다", () => {
  expect(experienceProgress(emptyExperience()).verified).toBe(false);
});
