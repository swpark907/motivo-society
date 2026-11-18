// 클래스·단원을 열 수 있는지 확인하는 한 곳. 계정별 수강 권한(구매·무료 범위)은 아직 정하지 않았다
// (AGENTS.md "클래스별 구매 구조"). 정책이 정해지면 이 파일의 판단만 바꾸고 화면은 그대로 쓴다.
// 진도에 따른 단원 해금(앞 단원을 마쳤는지)은 여기서 보지 않는다. 그것은 완료 기록에서 계산한다.

export type WorkbookAccess = { kind: "open" } | { kind: "units"; units: readonly number[] };

/** 지금은 무료 공개 체험이라 모든 단원이 열려 있다. */
export const workbookTrialAccess: WorkbookAccess = { kind: "open" };

export function canOpenWorkbookUnit(access: WorkbookAccess, unitNumber: number) {
  return access.kind === "open" || access.units.includes(unitNumber);
}
