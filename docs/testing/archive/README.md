# 폐기된 목적 선택 UI의 E2E 원문

2026-10-25 무료 공개 체험 회귀 정리 중 보존한 실행 비대상 원문이다. 목적 선택, 선택 접기, 삭제된 도움 카드, 구 단계명 및 단일 화면 수업을 기대하던 테스트를 현재 UI에 맞추었다. `.legacy.txt`는 Playwright에서 실행하지 않는다.

- `workbook.spec.ts.legacy.txt`: 목적별 전체 클래스 분기(세 목적)는 목적 선택이 제거되어 실행 대상에서 제외했다. 짧은 화면 실험의 유효한 세 테스트는 `e2e/workbook.spec.ts`에 유지했다. 현재 클래스는 `workbook-first-visit`, `workbook-navigation-flow`, 각 단원 `*-system`, `workbook-application-summary`, `workbook-class-summary-system`에서 검증한다.
- `workbook-map-panel.spec.ts.legacy.txt`: 목적별 안내 대신 미리보기만 변경하고 같은 수업으로 들어가는 현행 흐름, 수업 위치 보존, 완료 후 다음 수업 안내를 검증한다.
- `workbook-keyboard.spec.ts.legacy.txt`: 삭제된 선택 접기·도움 카드 대신 현재 시작 버튼·전체 과정·지도 도움말·수업의 실제 Tab/Enter/Escape 흐름을 검증한다.
- `workbook-optional-practice.spec.ts.legacy.txt`: 단원 전체를 한 화면으로 보던 예전 기대를 현재 3-1·4-1의 기본/선택 분리에 맞췄다. 후속 수업 전체는 해당 단원 system 테스트로 계속 검증한다.

제품의 완료 조건·진도·원문 기록을 테스트 통과 목적으로 완화하지 않았다. 이전 작업실 비교 UI 테스트는 삭제하지 않고 해당 UI가 유지되는 `/demo/workbook-home-next`로 이동했다. 공개 홈에서 비교 탭이 없는지는 `workbook-release-basics`에서 검증한다.
