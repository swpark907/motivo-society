import { describe, expect, it } from "vitest";
import { availablePublishStep, emptyPublish, publishProgress } from "./workbook-publish";

describe("공개 지도의 누적 선행", () => {
  it("후반 기록만으로 앞 점검을 건너뛰지 않는다", () => {
    const record = {
      ...emptyPublish(),
      visited: [true, true],
      addressReason: "주소 이유",
      fixed: true,
      verified: true,
    };
    expect(publishProgress(record).available).toEqual([true, false, false]);
    expect(availablePublishStep(record, 2)).toBe(0);
    expect(publishProgress(record).verified).toBe(false);
  });
  it("두 화면·버튼·공개 판단 다음에 두 주소 예시와 이유가 필요하다", () => {
    const record = {
      ...emptyPublish(),
      checked: [true, true],
      buttonChecked: true,
      privacyChoice: 1,
    };
    expect(publishProgress(record).available).toEqual([true, true, false]);
    expect(availablePublishStep(record, 2)).toBe(1);
    expect(
      publishProgress({ ...record, visited: [true, true], addressReason: " " }).addressed,
    ).toBe(false);
    expect(
      publishProgress({ ...record, visited: [true, true], addressReason: "실제 배포는 별도" })
        .available,
    ).toEqual([true, true, true]);
    expect(publishProgress({ ...record, checked: [] }).inspected).toBeFalsy();
  });
  it("문제·요청·수정·재확인·비교가 모두 있어야 예시가 완료된다", () => {
    const record = {
      ...emptyPublish(),
      checked: [true, true],
      buttonChecked: true,
      privacyChoice: 1,
      visited: [true, true],
      addressReason: "주소 이유",
      issueChecked: true,
      device: "모바일",
      action: "버튼 누름",
      expected: "목록",
      actual: "그대로",
      request: "버튼만 수정",
      fixed: true,
      verified: true,
      comparison: "목록 나타남",
    };
    expect(publishProgress(record).verified).toBe(true);
    for (const missing of [
      { request: " " },
      { comparison: " " },
      { verified: false },
      { issueChecked: false },
      { action: " " },
      { checked: [true, false] },
    ]) {
      expect(publishProgress({ ...record, ...missing }).verified).toBe(false);
    }
  });
});
