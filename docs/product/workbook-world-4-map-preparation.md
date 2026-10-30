# 공개와 운영 독립지도 준비 — 2026-10-10

데이터 마을 검수 마감 뒤 기존 승인 범위로 조사했다. 중단된 정적 구현을 재개했다. 아직 기능·실화면 검수 완료가 아니다.

기존 활동을 그대로 연결한다: 공개 전 점검 → 주소와 배포 → 공개 후 문제 해결. 공개 전 두 화면 확인·버튼 확인·개인정보 판단이 다음 지점의 선행이다. 두 기기 접속 예시와 주소 이유 기록이 마지막 지점의 선행이다. 문제 재현·기기/행동/기대/실제 결과·수정 요청·수정 후 재확인·비교 기록으로 예시 완료한다. 예시 주소와 학습자의 실제 공개 본인 기록은 별도이며 외부 배포 인증으로 표시하지 않는다.

다음 한 걸음은 기존 자산 적합성을 대조하고 세 건물과 연결 길이 있는 항구 지형 최소 후보를 준비하는 것이다. 기존 AI 섬·첫 제작 호수·화면 강·데이터 고산과 배경/지형/동선을 구별한다. 데이터의 누적 선행 순수함수·방문 context 단계·직접 진입 가드·공유 마커 스타일을 재사용한다. 현재 공개 수업은 로컬 step을 쓰므로 context publishStop으로 옮길 때 취소/왕복/완료 재방문을 보존한다. 기획 변경은 후속 위치를 초기화하며 본인 적용 기록 정책을 바꾸지 않는다.

정적 구현/CPU 준비 뒤 조율자에게 별도 workers=1 기능→단일IAB 두 폭 슬롯을 요청한다. 사용자 localhost3211/Next44714는 유지한다. 새 계정·유료API·외부 파일/업로드·DB·실제 배포·회원 저장·선택 심화는 추가하지 않는다.

## 현재 정적 구현

항구 후보 한 장을 내장 image_gen으로 생성했다. 기존 자산은 AI 섬·첫 제작 호수/절벽·화면 강/정원·데이터 고산과 옛8지점 시안뿐이라 새 마을 구별 조건에 부적합했다. 원본 `generated_images/exec-3fe2bd49-3a5a-47c5-a70e-c7212b383b21.png`, 적용 `public/images/workbook/journey/publish-harbour-v1.png` (1536×1024). 그림을 직접 읽어 점검 회관21%,64% / 발송소51%,39% / 수리 공방79%,70% 공터에 마커를 배치했다. 해안 항구의 육지 돌길을 따라 연결하며 앞선 지도와 지형/건물/경로가 다르다. 가장자리 작은 소품/부분 지붕은 학습 목적지가 아니며 실제 화면 가림은 검수 대기다.

WorkbookPublishMap은 공용 지도 스타일/캐릭터를 재사용한다. context publishStop과 mapWorld publish를 추가하고 수업의 로컬 step을 방문 상태로 옮겼다. publishProgress는 두 화면·버튼·개인정보 판단 → 두 주소 접속 예시·이유 → 문제 기록·요청·수정·재확인·비교를 누적 판정한다. 지도·직접 진입·다음·완료가 같은 조건을 쓴다. 기획 변경은 공개 위치도 초기화한다. 데이터 수정으로 공개가 잠겨도 기존 공개 기록은 보존하는 정책을 바꾸지 않았다.

신규 순수 검사3개와 기존 영향 PC/모바일2 흐름의 지도 잠금·원화·키보드 직접 진입·취소 후 현재 단계·완료 재방문·이야기/목록 뒤로 가기·기획 변경 잠금을 준비했다. E2E와 IAB는 혼례v008 반환 뒤 조율 명시 슬롯 대기다. 데이터 지도 완료분은 재검수하지 않는다. 실제 저장/배포를 인증하는 UI나 외부 실행을 추가하지 않았다.

## 생성 프롬프트 (내장 도구, 새 이미지, 참조 이미지 없음)

Use case: stylized-concept. Asset type: 1536x1024 full-bleed 3:2 detailed handcrafted 16-bit pixel-art RPG learning village map for Motivo Workbook PUBLISH AND OPERATE. Create a distinct coastal PORT town along a broad crescent stone harbour promenade. Not an island map, not a lake cliff, river garden, or alpine forest. Warm refined adult-friendly pixel world, muted coastal sand, turquoise sheltered sea, weathered timber and pale stone, amber windows. Three-quarter aerial view. Exactly THREE main learning buildings: left lower shore a small inspection hall with outdoor display board, at approximately22%,65%; middle upper harbour a dispatch house with short pier and small signal mast at50%,35%; right lower shore a repair workshop with outdoor workbench at79%,65%. Each has a large empty round stone/dirt plaza in front for HTML markers and character. One clearly readable continuous WALKABLE stone promenade connects left inspection plaza to central dispatch plaza to right repair plaza around the shoreline. Sea fills upper background and small boats sit beyond the promenade, land connects all three buildings, no road over open water. Wide safe central area for all three plazas. Only three main buildings, no large unused destinations. No characters, text, labels, letters, numbers, UI circles, markers, route dashes, borders, logos or HUD. Terrain circles are ground, not baked UI. Keep real square-pixel details and sophisticated warm mood, no candy colours or 3D rendering.

## CPU 검증

2026-10-10 Node22.14 pnpm check/session32618 exit0:9파일20 PASS. 신규 공개 누적 선행3검사 포함. 기능·실화면 검수는 아직 미실행이며 준비 완료 보고 후 명시 슬롯을 기다린다. 자체 코드 대조에서 취소 재진입 검사에 남은 옛 ‘첫 단계부터 다음’ 조작을 제거했고 완료 재방문은 바로 마지막 단계로 확인하도록 수정했다. 새 외부 실행 없음.

## 실제 검수 완료 — 2026-10-10

공개 영향 PC·모바일2 workers=1/session70328 exit0:2 PASS39.4초(첫 실행 통과). 준비된 check/session32618 9파일20 PASS를 불필요 반복하지 않았다. 신규 제품 수정 없음. 서버 직전 HTTP000/exit7와3211리스너부재를 확인했고 pnpm dev -p3211 기본 샌드박스 실행은 EPERM으로 실패했다. 정식 require_escalated 재실행 session8150/Next60221 Ready 후 기존 서버를 재사용했다. 이는 제품/기능 검사 실패와 별개다.

단일 IAB11 PC1440×900·모바일390×844 정상 경로에서 별도 항구 지형·세 공터·육지 연결길, 지점 잠금/직접 진입, 키보드 Enter/Space, 취소·완료 위치, 이야기/목록 뒤로 가기, 같은 기획·본인 미실습 기록 보존을 확인했다. 수정 요청을 바꾸면 완료가 잠기고 예시 적용 후 같은 버튼을 다시 확인해야 열렸다. 주소 이유를 지우면 마지막 지점이 잠기고 현재 위치는 주소 단계였다. 모바일 가로 이동으로 마지막 마커 전체를 읽고 문서 폭390px을 유지했다. 추가 UI/스타일 보정 없음. 선행 정상 기록은 한 번 준비해 두 폭에서 재사용했으며 데이터 지도 재검수는 하지 않았다.

IAB 선행 준비에서 선택/버튼 확인을 빠뜨린 2번의 disabled next 오류는 검수 조작 누락으로 실제 조건을 확인한 뒤 정상 진행했다. 제품 결함으로 세지 않는다. 선행5수업 정리에 남은 ‘다음 맵은 준비 중’ 문구를 관찰했지만 이번 공개 범위에서 수정하지 않고 후속 카피 정리 잔여로 남긴다.

증빙 `/tmp/workbook-publish-map-design-20261010/desktop-initial.jpg`, `desktop-completed.jpg`, `mobile-completed-right.jpg`, `mobile-address-invalidated.jpg`, `mobile-address-plaza.jpg`. 초점 맞추기 직후 가장자리에서 잘린 사진은 가로 이동 완료 사진과 함께 보며 모바일 스크롤 자체를 결함으로 세지 않는다. IAB11닫음/viewport원복/탭없음. worker60302/60436 ps없음(reaped), Playwright/headlessChrome pgrep없음. 사용자 Next60221만3211LISTEN/클래스HTTP200 유지. 커밋/푸시/배포/실제 외부 저장 없음. 전체사이트 E2E/별도성능/학습자 외부 앱 실습은 미실행이다.
