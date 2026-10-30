# 동작과 데이터 독립 지도 — 2026-10-09

부모가 전달한 사용자 직접 승인으로 기존 세 활동을 서로 다른 고산 마을 지도에 연결한다. 실제 저장·DB/API·외부 파일·배포를 추가하지 않는다. 기본 학습은 같은 홈페이지의 방문 메모리 시뮬레이션이며 회원별 저장은 미연결이다.

| 학습 지점        | 기존 활동                               | 다음 지점 조건                                            |
| ---------------- | --------------------------------------- | --------------------------------------------------------- |
| 입력과 화면 변화 | 입력창의 글과 버튼으로 표시한 글을 비교 | 메모를 입력하고 화면에 표시한 기록                        |
| 새로고침과 저장  | 저장 전후 새로고침 흉내로 값 비교       | 저장 없이 다시 열기와 저장 후 다시 열기를 모두 확인       |
| 다른 기기와 서버 | 다른 기기 예시와 함께 읽는 저장소 판단  | 다른 기기 확인·서버가 필요한 경우 선택·이유 기록으로 완료 |

기존 자산은 현재 AI/첫 제작/화면 지도와 옛8장소 시안뿐이라 전용 고산 지형 후보1장을 내장 image_gen으로 생성했다. 입력 작업실→기록 창고→연결 관측소의 세 공터와 산길로 연결한다. 기존 AI의 해안 섬, 첫 제작의 호수·절벽, 화면의 강·정원과 지형/건물/동선이 다르다. 생성 원본 `generated_images/exec-c548e603-dd62-4964-903f-497ca7ba0982.png`, 적용 파일 `public/images/workbook/journey/data-alpine-archive-v1.png`. 새 계정/credential/CLI/API/외부 업로드 없음. AI 생성 학습 장면이며 실제 도구/외부 실습 증빙이 아니다.

그림을 읽고 좌표는 작업실22%,67%/창고50%,29%/관측소79%,70%로 확정했다. 프롬프트 위치를 그대로 채택하지 않았다. 지도 마커·완료 표시·캐릭터는 코드가 소유한다. 기존 WorkbookMap.module.scss와 캐릭터/버튼 패턴을 재사용하고 단계는 방문 context의 dataStop에서 유지한다. 수업은 같은 dataProgress 누적 선행 판정을 사용한다. 후반 기록만으로 앞 활동을 우회하지 못하고 입력 변경은 데이터의 후속 지점/완료를 다시 확인하게 한다. 공개 단원은 데이터 재확인 전 잠기며 기존 공개 기록은 보존한다. 홈페이지 기획 변경은 기존 후속 기록과 데이터 위치를 처음으로 초기화한다.

2026-10-10 실제 검수: 영향 PC·모바일 2흐름 workers=1 최종 2 PASS35.8초/session82619 exit0. 첫 session75302의 2 FAIL은 두 번째 본인 기록 작성에서 이미 보존된 ‘아직 직접 적용 전’을 ‘미기록’으로 기대한 검사 오류다. 제품 상태를 되돌리지 않고 기대값을 고쳤다. 실패 증빙 `/tmp/workbook-data-map-first-failure-20261010`.

단일 IAB10에서 PC1440×900·모바일390×844 정상 경로를 확인했다. 선행 AI·제작·화면 기록은 한 번 진행해 재사용했다. 세 지점 직접 진입과 잠금, 저장 전후 예시, 완료 위치, 이야기 왕복, 입력 변경 후 후속 잠금과 본인 기록 보존을 확인했다. 고산 지형과 세 건물·산길은 기존 세 지도와 다르며 완료 체크와 캐릭터 접지선 가림은 없었다. 모바일 지도 내부 가로 이동으로 마커 전체를 읽고 페이지 폭390px을 유지했다. 추가 제품/스타일 보정은 없었다. 선행 화면 단원에서 모바일 확인을 빠뜨려 완료 버튼이 잠긴 것은 검수 조작 누락이며 두 폭 확인 후 정상 진행했다.

캡처 `/tmp/workbook-data-map-design-20261010/`: desktop-data-initial/archive/completed.jpg, mobile-data-right/invalidated/initial-left.jpg. IAB10 닫음·viewport 원복·탭 목록 빈 값 확인. 사용자 서버는 직전 부재·3211미사용 확인 후 승인된 pnpm dev -p3211로 복구한 session24217/Next44714를 유지한다. 공개 마을은 다음 승인 범위로 정적 준비한 뒤 별도 검수 차례를 받는다. 최종 check/session21275 exit0:8파일17 PASS, git diff --check 통과. 직전63011은 자산 문서 포맷 FAIL만 정리했다. 자기 테스트44794/44918/45202/45301 종료/reaped 및 Playwright/headless Chrome 무일치 확인. Next44714의3211 LISTEN/클래스HTTP200은 유지했다. 전체 사이트 E2E, 실제 외부 실습·저장·배포는 미실행이다.

## 생성 프롬프트

Use case: stylized-concept. Asset type: 1536x1024 full-bleed 3:2 pixel-art RPG learning village map for Motivo Workbook BEHAVIOR AND DATA. Create a DISTINCT alpine pine mountain village, no ocean island, no lake cliff settlement, no river garden. Geography: dry rocky highland valley with terraced paths, spruce forest, distant pale snowy peaks, warm amber workshop windows, cool muted mountain stone. Same richly detailed sophisticated handcrafted 16-bit square-pixel three-quarter aerial art as a warm capybara learning world for adults. Exactly THREE learning landmarks: a small mechanical tinkering workshop with an outdoor writing desk and button-like mechanical lever on lower left (about x22%, y65%); a timber-and-stone archive storehouse with visible orderly shelves and sealed storage boxes on upper middle (about x50%, y35%); a modest communications observatory with two separate simple signal towers on lower right (about x78%, y65%). Each landmark needs a large empty ROUND dirt ground clearing in front for later HTML marker and character. One clearly readable continuous pale mountain footpath connects workshop→archive→observatory in an inverted V route with natural switchbacks between elevations, safely grounded, no impossible water crossing. Landscape is alpine ledges and forest, not urban or futuristic electronics. Buildings evocative of input/action, keeping records, and cross-device connection, not literal branded software. Keep all three clearings inside central safe area. Exactly three main buildings, no unmarked large building destinations, no characters, no text, no labels, no numbers, no map markers, no UI circles, no borders, no HUD, no baked-in route dashes. Ground circles are dirt terrain, not UI. Beautiful refined warm adult-friendly mood, no candy colors, no 3D rendering.
