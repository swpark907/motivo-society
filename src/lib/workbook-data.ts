// 이전 추가 기록의 형태는 보존하되 기본 학습 완료 조건에 사용하지 않는다.
export type DataBranch = "details" | "storage";
export type FeatureChoice = {
  value: "apply" | "omit" | null;
  reason: string;
  request: string;
  ready: boolean;
  checks: boolean[];
  result: string;
  problem: string;
};
export type OwnData = {
  details: FeatureChoice;
  storage: FeatureChoice;
  scopeChoice: number | null;
  scopeReason: string;
  scopeChecks: boolean[];
};
export const emptyFeatureChoice = (): FeatureChoice => ({
  value: null,
  reason: "",
  request: "",
  ready: false,
  checks: [false, false, false, false],
  result: "",
  problem: "",
});
export const emptyOwnData = (): OwnData => ({
  details: emptyFeatureChoice(),
  storage: emptyFeatureChoice(),
  scopeChoice: null,
  scopeReason: "",
  scopeChecks: [false, false],
});
export type DataRecord = {
  mode?: "computer" | "example";
  own?: OwnData;
  draft: string;
  shown: string;
  source: string;
  saved: string;
  predictions: (number | null)[];
  displayed: boolean;
  withoutSave: boolean;
  withSave: boolean;
  otherChecked: boolean;
  serverChoice: number | null;
  reason: string;
};
export const emptyData = (): DataRecord => ({
  draft: "",
  shown: "",
  source: "",
  saved: "",
  predictions: [null, null, null],
  displayed: false,
  withoutSave: false,
  withSave: false,
  otherChecked: false,
  serverChoice: null,
  reason: "",
});
// 지도와 수업이 같은 누적 선행 조건을 사용한다. 후반 기록만으로 앞 활동을 건너뛰지 않는다.
export function dataProgress(record: DataRecord) {
  const displayed = record.displayed && !!record.source.trim();
  const stored = displayed && record.withoutSave && record.withSave && !!record.saved.trim();
  const verified =
    stored && record.otherChecked && record.serverChoice === 1 && !!record.reason.trim();
  return { displayed, stored, verified, available: [true, displayed, stored] };
}
export function availableDataStep(record: DataRecord, step: number) {
  const progress = dataProgress(record);
  return progress.available[step] ? step : progress.displayed ? 1 : 0;
}
