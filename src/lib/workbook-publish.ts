export type PublishRecord = {
  checked: boolean[];
  buttonChecked: boolean;
  privacyChoice: number | null;
  addressChoice: number | null;
  addressResult: number | null;
  visited: boolean[];
  addressReason: string;
  issueChecked: boolean;
  device: string;
  action: string;
  expected: string;
  actual: string;
  request: string;
  fixed: boolean;
  verified: boolean;
  comparison: string;
};
export const emptyPublish = (): PublishRecord => ({
  checked: [false, false],
  buttonChecked: false,
  privacyChoice: null,
  addressChoice: null,
  addressResult: null,
  visited: [false, false],
  addressReason: "",
  issueChecked: false,
  device: "",
  action: "",
  expected: "",
  actual: "",
  request: "",
  fixed: false,
  verified: false,
  comparison: "",
});
// 선행과 완료는 누적 판정한다. 후반 기록만으로 앞 지점을 우회하지 않는다.
export function publishProgress(record: PublishRecord) {
  const inspected =
    record.checked[0] && record.checked[1] && record.buttonChecked && record.privacyChoice === 1;
  const addressed =
    inspected && record.visited[0] && record.visited[1] && !!record.addressReason.trim();
  const reportReady =
    record.issueChecked &&
    [record.device, record.action, record.expected, record.actual].every((text) => !!text.trim());
  const verified =
    addressed &&
    reportReady &&
    record.fixed &&
    record.verified &&
    !!record.comparison.trim() &&
    !!record.request.trim();
  return { inspected, addressed, reportReady, verified, available: [true, inspected, addressed] };
}
export function availablePublishStep(record: PublishRecord, step: number) {
  const progress = publishProgress(record);
  return progress.available[step] ? step : progress.inspected ? 1 : 0;
}
