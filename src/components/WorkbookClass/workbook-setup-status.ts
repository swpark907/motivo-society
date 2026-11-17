// 1-4에서 학습자가 직접 남긴 준비 상태. 외부 앱을 자동으로 검사하지 않는다.
export type SetupStatus = "ready" | "pending" | "review";
export const setupStatusLabels = {
  ready: "컴퓨터 준비 확인 · 본인 확인",
  pending: "설명 확인 · 컴퓨터 준비 필요",
  review: "복습 확인 · 컴퓨터 준비 필요",
};
