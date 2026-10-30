> 2026-10-10 최신 상태: 데이터 고산·공개 항구까지 기본4마을의 기존 최소3활동/서로 다른 독립지도 연결과 기능·두폭 검수를 마쳤다. 아래 이전 미구현 기록은 당시 이력이다. 공개 검수 영향2 PASS39.4초/check20 PASS, 자세한 실제 근거는 `workbook-world-4-map-preparation.md`. 전체 상세 커리큘럼/학습자 외부 실습·회원 저장·선택 심화 완료를 뜻하지 않는다.

## 현재 지도별 비교 캡처 — 2026-10-10

각 사진은 정상 학습 경로로 확인한 기존 검수 증빙이다. PC 사진으로 전체 지형·톤을 비교하고 모바일 사진으로 현재 지점과 가로 이동을 확인한다. 임시 경로는 향후 정리될 수 있으므로 아래 적용 원화도 함께 기록한다.

| 지도                       | PC 실제 화면                                                                 | 모바일 실제 화면                                                                | 적용 원화                      |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------ |
| AI 입문 · 가을 섬          | [PC](/tmp/workbook-village-difference-20261009/desktop-ai.jpg)               | [모바일](/tmp/workbook-village-difference-20261009/mobile-ai.jpg)               | ai-beginner-five-places-v1.png |
| 기획과 첫 제작 · 호수/절벽 | [PC](/tmp/workbook-village-difference-20261009/desktop-project-final.jpg)    | [모바일](/tmp/workbook-village-difference-20261009/mobile-project-final.jpg)    | map.png                        |
| 화면과 사용 경험 · 강/정원 | [PC](/tmp/workbook-village-difference-20261009/desktop-experience-final.jpg) | [모바일](/tmp/workbook-village-difference-20261009/mobile-experience-final.jpg) | experience-river-garden-v1.png |
| 동작과 데이터 · 고산       | [PC](/tmp/workbook-data-map-design-20261010/desktop-data-completed.jpg)      | [모바일](/tmp/workbook-data-map-design-20261010/mobile-data-right.jpg)          | data-alpine-archive-v1.png     |
| 공개와 운영 · 항구         | [PC](/tmp/workbook-publish-map-design-20261010/desktop-completed.jpg)        | [모바일](/tmp/workbook-publish-map-design-20261010/mobile-completed-right.jpg)  | publish-harbour-v1.png         |

5수업의 이전 ‘다음 맵은 준비 중’ 안내는 부모 직접 승인으로 ‘마을로 돌아가 기획과 첫 제작 지도에서 이어가요’로 최소 수정했다. 버튼·진입 조건·라우팅은 변경하지 않았다. 실제 경로는 5수업 완료→같은 AI 지도 복귀→기획과 첫 제작 지도 선택이며 기존 영향2 검수에서 정상 진행한 경로다.

# 마을별 지도 구별 — 2026-10-09

사용자 실제 검수에서 다른 마을에 같은 지도 배경을 재사용한 문제가 지적됐다. 새 직접 지시는 색·이름만 바꾸는 대신 지형·배경·동선·학습 지점 배치로 마을을 구별하는 것이다. 기존 두 지도 구현 문서의 같은 원화 재사용은 당시 이력이며 이 결정으로 교체한다.

## 실제 자산 매핑과 최소 적용

| 마을             | 조사 당시                      | 이번 적용                                        | 구별되는 지형/지점                                                        |
| ---------------- | ------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------- |
| AI 입문          | ai-beginner-five-places-v1.png | 그대로 유지                                      | 가을 바다 섬의 다섯 건물·다섯 수업                                        |
| 기획과 첫 제작   | 위 AI 원화 그대로              | 준비된 map.png 우선 재사용                       | 석양 호수·절벽·작업실24,62 → 정류장50,44 → 광장78,62                      |
| 화면과 사용 경험 | 위 AI 원화 그대로              | experience-river-garden-v1.png 신규 후보1장 적용 | 내륙 강·버드나무·석조 정원/돌다리. 정자20,26 → 공방32,73 → 비교 마당80,46 |
| 동작과 데이터    | 독립 지도/자산 없음            | data-alpine-archive-v1.png 후속 정적 연결        | 고산 침엽수/입력 작업실·기록 창고·연결 관측소3곳. 기능·실화면 검수 대기   |
| 공개와 운영      | 독립 지도/자산 없음            | 기존 최소 단원 유지                              | 공개 항구 방향의 기존 기획만 있음. 전용 그림/배치 미구현                  |
| AI와 일하는 방식 | 선택 심화 이름만 안내          | 변화 없음                                        | 전용 지도/실제 활동 미구현                                                |

map.png는 기존 `/workbook/journey` 짧은 실험의 준비된 자산이다. 그 실험은 별도 상태 경계로 보존한다. 현재 바이브코딩 클래스의 다른 마을끼리는 같은 배경을 쓰지 않는다. world-1-map-v1/v2/v3는 옛8장소 원화 및 구운 원형 표시8/9개 시안이므로 그대로 사용해 옛 학습 지점을 복원하지 않는다.

기존 context의 AI currentStop/Project projectStop/Experience experienceStop은 그대로 유지한다. 마을의 각 인덱스를 같은 학습 단계로 연결하고 그림에 맞춰 좌표·SVG 동선만 바꾼다. 기획/요청/관찰·선행 조건·완료/본인 실습 구분·이야기와 라우트 왕복 상태는 바꾸지 않는다. 회원 저장/localStorage/DB/API·외부 파일·배포 추가 없음.

사용자 열람 서버3211과 사용자 탭은 보존한다. Next 개발 서버에서 코드·이미지 경로 변경을 자동 반영하며 화면 상태를 바꾸는 새로고침을 먼저 요구하지 않는다. 수동 새로고침이 필요하면 현재 방문 기록이 초기화됨을 알려야 한다.

## 후보 제작·출처·검수 상태

기존 imagegen 스킬의 내장 image_gen으로 새 화면 마을 후보1장을 만들었다. 새 계정·credential·유료 CLI/API·외부 업로드 없음. AI 생성 그림이며 실제 지역·실제 도구 사용/외부 실습 증빙이 아니다. 원본 `generated_images/exec-d580fd69-c2d4-47c3-a7da-ce81704fab66.png`를 보존하고 `public/images/workbook/journey/experience-river-garden-v1.png`에 복사했다. 원본은1536×1024이고 원형 땅은 배경, 상태 마커는 코드로 분리했다.

그림 자체에서3개 공터와 돌다리 연결을 읽고 좌표를 확정했다. 프롬프트의 위치를 그대로 채택하지 않았다. 정적 Node22.14 check7파일14 PASS/session17538 exit0. 첫 영향 PC/모바일2 E2E는 workers=1/session37785에서2 PASS39.1초/exit0이다.

단일 IAB9에서 PC1440×900/모바일390×844 실제 검수를 마쳤다. AI5 선행을 정상 경로로 한 번 진행하고 같은 입력을 재사용했다. Project의 호수·절벽·정류장, Experience의 강·정원·돌다리·비교 마당과 각 세 지점의 배치/동선이 실제 화면에서 구별된다. 완료 체크와 캐릭터 접지선이 겹치지 않는다. 모바일에서는 지도 안을 가로로 이동하면 마커·이름·캐릭터 전체를 볼 수 있고 페이지 자체의 폭은390px이다. 기록·선행·키보드 직접진입·취소·완료 재방문·마을/이야기/목록 뒤로 가기 후 위치 복원을 확인했다. 예시 복습 완료와 실제 파일 적용 전 기록은 별개로 남았다.

실제 발견 결함: Project 본문에 남은 ‘다음 지도는 준비 중이에요.’를 ‘화면과 사용 경험 지도에서 이어가요.’로 최소 수정했다. 새 배경이나 경로의 추가 스타일 보정은 필요하지 않았다. IAB의 AX checkbox 표시를 실제 DOM button과 혼동한2회 조회와 AI지도 접근성 이름1회 조회는 검사 도구 선택 오류이며 제품 결함이 아니다. 첫 기능 E2E 실패는 없다.

실제 캡처는 `/tmp/workbook-village-difference-20261009/`의 `desktop-ai.jpg`, `desktop-project-initial.jpg`, `desktop-project-final.jpg`, `desktop-experience-initial.jpg`, `desktop-experience-step1.jpg`, `desktop-experience-final.jpg`, `mobile-ai.jpg`, `mobile-project-left.jpg`, `mobile-project-final.jpg`, `mobile-experience-left.jpg`, `mobile-experience-final.jpg`다. 모바일 최종 사진은 가로 스크롤 끝에서 전체 현재 마커를 확인한 증빙이다. IAB9를 닫고 viewport를 원복했으며 탭 목록은 빈 값이었다. 사용자 서버3211과 사용자 탭은 종료하지 않는다.

안내 보정 뒤 같은 영향 PC/모바일2 E2E도 workers=1/session25775에서2 PASS38.7초/exit0이다. 전체 사이트 E2E·다른 월드 추가 검수·별도 성능 측정은 실행하지 않았다.

최종 Node22.14 pnpm check/session7077 exit0:7파일14 PASS. 자체 코드 리뷰 correctness 추가 문제 없음. 자기 테스트 PID12175/12392/17232/17486은 ps 조회에서 없고 Playwright/headless Chrome도 일치 없음이다. 사용자3211리스너는 PID930만 유지하며 클래스 localhost HTTP200을 확인했다. 서버 보존은 사용자 직접 열람 요청에 따른 의도된 상태이며 슬롯 반환 후에도 종료하지 않는다.

재사용 패턴: 방문 context의 진행키/마을별 마지막 단계는 유지하고, 지도별 이미지·alt·좌표·SVG 동선만 각 지형에 맞춘다. 세 지점의 선행 조건과 수업 단계 진입은 기존 도메인 판정을 공유한다. 원형 공터는 배경에 있고 완료/해금 마커는 코드가 소유한다. 새 마을의 조건·활동 구현 승인 없이 이미지부터 만들거나 기존 그림을 색만 바꿔 독립 지도로 세지 않는다.

남은 필수 클래스 범위는 동작과 데이터·공개와 운영의 독립 지도/학습 지점 및 기존 최소 단원을 확정 학습 결과에 맞춘 보강이다. 전용 자산은 아직 없다. 선택 심화 AI와 일하는 방식의 실제 활동/지도는 별도 미구현이다. 실제 Windows/Mac 외부 실습·파일 변경·공개 주소 검증은 대행하지 않았고 회원별 저장도 미연결이다. 이번3지도 검수는 전체 클래스 완성을 뜻하지 않는다.

## 최종 생성 프롬프트

Use case: stylized-concept. Asset type: full-bleed landscape game world map for the Korean Motivo Workbook, 1536x1024 landscape 3:2 composition. Create a DISTINCT screen-and-user-experience village, NOT an autumn rocky ocean island: a lush inland river valley with pale stone terraces, a river running diagonally from upper-middle toward lower-right, a broad arched footbridge, airy willow trees and terraced cream-stone gardens. Handcrafted richly detailed sophisticated 16-bit pixel-art RPG overworld, crisp square pixels, three-quarter aerial view, muted forest green, pale warm stone, deep teal water and warm amber windows. Same warm human adult-friendly visual quality as a capybara learning world, no candy colors, no 3D render. EXACTLY THREE primary learning destinations with readily visible separate beige ROUND GROUND CLEARINGS before their facades for later HTML marker overlays: first an open observation pavilion on the left upper terrace approximately (24% x,38% y), second a small bright design/maker studio with windows and design boards in the lower-left garden approximately (40% x,74% y), third a screen-comparison courtyard featuring TWO differently-sized simple framed display panels at right middle approximately (78% x,52% y). These displays should be blank/abstract layout blocks, no lettering. One continuous readable pale dirt path connects the 3 round clearings: pavilion down via left terrace to studio, then east and across a single arched bridge above the river to comparison courtyard. River must not cut any of the paths without a bridge. Path is real terrain, ground clearings must be empty generous space bordered by low vegetation, not UI rings. Strongly differentiated land silhouette, building arrangement and winding path from an ocean-cliff village. Background includes only low garden landscape, river, hills, bridges, rocks and willow vegetation; no extra large unmarked buildings. Keep all three clearings inside central safe area, do not crop architecture, map fills entire frame. No characters, no capybara, no baked-in markers, no circular UI dots, no labels, no text, no numbers, no borders or HUD. This map will host three independent clickable lesson stages; visual clarity of terrain and connectivity matters as much as beautiful pixel detail.
