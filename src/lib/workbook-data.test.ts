import { describe, expect, it } from "vitest";
import { availableDataStep, dataProgress, emptyData, emptyOwnData } from "./workbook-data";

describe("데이터 수업의 누적 선행 조건", () => {
  it("뒷 단계의 확인 기록만으로 입력·저장 활동을 건너뛰지 못한다", () => {
    const record = {
      ...emptyData(),
      withSave: true,
      saved: "메모",
      otherChecked: true,
      serverChoice: 1,
      reason: "함께 읽기",
    };
    expect(dataProgress(record).available).toEqual([true, false, false]);
    expect(dataProgress(record).verified).toBe(false);
    expect(availableDataStep(record, 2)).toBe(0);
  });
  it("표시 뒤에도 저장 전후 두 확인을 모두 마쳐야 다른 기기 지점이 열린다", () => {
    const record = {
      ...emptyData(),
      displayed: true,
      source: "메모",
      saved: "메모",
      withSave: true,
    };
    expect(dataProgress(record).available).toEqual([true, true, false]);
    expect(availableDataStep(record, 2)).toBe(1);
    expect(dataProgress({ ...record, withoutSave: true }).available).toEqual([true, true, true]);
  });
  it("표시·저장·다른 기기 확인과 서버 판단 이유가 있어야 완료한다", () => {
    const record = {
      ...emptyData(),
      displayed: true,
      source: "메모",
      saved: "메모",
      withoutSave: true,
      withSave: true,
      otherChecked: true,
      serverChoice: 1,
      reason: "친구 기기와 함께 읽어요",
    };
    expect(dataProgress(record).verified).toBe(true);
    expect(dataProgress({ ...record, reason: " " }).verified).toBe(false);
    expect(dataProgress({ ...record, serverChoice: 0 }).verified).toBe(false);
  });
});

describe("이전 선택 기록 보존", () => {
  it("이전의 적용·생략 기록을 채우지 않아도 기본 학습을 판정한다", () => {
    const own = emptyOwnData();
    const record = {
      ...emptyData(),
      mode: "computer" as const,
      own,
      displayed: true,
      source: "예시",
      withoutSave: true,
      withSave: true,
      saved: "예시",
      otherChecked: true,
      serverChoice: 1,
      reason: "기기 범위",
    };
    expect(dataProgress(record).verified).toBe(true);
    expect(record.own).toBe(own);
  });
});
