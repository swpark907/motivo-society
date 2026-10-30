# 웹사이트 결과물 중심 썸네일 후보 v2 — 2026-10-15

라이프스타일 v1은 웹 제작보다 카페/목공/사진 강의로 오인될 수 있어 채택하지 않았다. 기존 본편과 v1 파일은 보존했고 `/demo/workbook-thumbnails`의 신규 후보 영역만 v2로 갱신했다. 동일한 기기 목업의 색 변형 대신 서비스 랜딩(좌제목/우사진/CTA), 포트폴리오(검정 화면/큰 비대칭 작업 배열), 개인 기록(세로 사진/짧은 기록/잡지형 여백)의 서로 다른 웹 구성을 사용한다.

| 목적        | 생성 원본 (generated_images/)                 | 후보 (public/images/workbook/candidates/) |
| ----------- | --------------------------------------------- | ----------------------------------------- |
| 서비스      | exec-e5df0513-404b-4b9b-9217-5c90c8051729.png | service-website-v2.png                    |
| 포트폴리오  | exec-cc0f7a84-6a1b-422a-af92-d1504b5bc3c5.png | portfolio-website-v2.png                  |
| 개인 사이트 | exec-e82b2683-e132-47b3-9491-7cf549fa22dc.png | personal-website-v2.png                   |

## 실제 확인한 범위

내장 image_gen으로3장 생성. 각 원본을 view_image로 열람하고, sips로 340px폭 QA 복사본만 축소해 다시 열람했다. 축소는 생성 이미지를 편집/합성한 대체 작품 제작이 아니라 카드 크기 식별성 검토용이며 원본/후보는 그대로 보존한다. QA 복사본은 `/tmp/workbook-website-thumbnail-qa/{service,portfolio,personal}-340.png`다.

- 서비스: 340px에서도 ‘작은 가게의 첫 웹페이지’·오렌지 버튼·상단탐색·하단섹션이 보인다. 사진이 페이지 내부 콘텐츠로 읽힌다. 작은 본문은 판독 대상이 아니며 실물 카드 제목/설명은 HTML로 제공한다.
- 포트폴리오: 큰 SELECTED WORK·세 작업타일·탐색줄이 남아 포트폴리오 화면으로 읽힌다. 사진/책/모바일페이지 타일을 서로 다른 크기로 배치한다. 서비스의 양분 히어로와 구별된다.
- 개인 사이트: ‘나의 작은 발견’ 제목·왼쪽세로사진/오른쪽두기록·탐색구조가 남는다. 카메라를 든 사람보다 웹 기록 구성이 주인공이다.

이미지 속 주소·날짜·작품은 AI가 만든 시각 예시다. 실제 접속 가능한 사이트·수강생 성과·검증된 출처가 아니며 해당 주소에 접속하지 않았다. 이미지의 검색아이콘/탐색/콘텐츠배치는 디자인 예시이고 강의가 그 모든 기능의 동작 구현을 보장한다는 뜻은 아니다. 비교 페이지에도 생성된 구성 예시/실제 수강 결과나 동작 사이트가 아님을 명시했다.

비브라우저 검사: `pnpm check` session55802 exit0, typecheck/lint/prettier 및9파일20테스트통과. 자체리뷰에서 기존 WorkbookExamples/홈/클래스 미변경, 버전별자산보존, 서버컴포넌트/next Image/robots noindex/기존링크유지 확인. 실제 카드렌더/모바일뷰포트/클릭E2E/여백·잘림은 미검증이다. 알려진 CUA 서비스오류를 재시도하거나 다른 브라우저로 우회하지 않았다. 사용자3000서버는 종료/재시작하지 않았다. 커밋·공개배포없음.

## 원문 생성 프롬프트

### service

Use case: ui-mockup. Asset: 16:9 landscape website-result thumbnail for Korean beginner web course, clearly a BEAUTIFUL FINISHED SERVICE INTRODUCTION WEBSITE, not a slide, not a lifestyle photograph. Straight-on tightly cropped browser window fills 95% canvas, slim charcoal browser chrome with tiny address pill and three subtle controls. Website for a small neighborhood cafe menu-and-story webpage service concept. Warm ivory editorial layout, deep black typography, ONE restrained orange CTA. Strong left aligned two-line Korean headline EXACT text "작은 가게의\n첫 웹페이지", small subtitle "메뉴와 이야기를 한곳에", orange button "내용 보기". Right hero is a large warm photograph of a cafe window, coffee and hands (inside the webpage, never full-bleed outside UI). Clean slim top navigation "STORY MENU CONTACT", large whitespace, below hero a cropped row of three simple content sections. Contemporary highly desirable actual web design, coherent typography, sharp corners, no shadows, no gradients, no floating devices, no 3D, no slide/deck styling, no huge title outside the page. Page is an illustrative concept, no real logos, no revenue/booking/payment/signup features. Prioritize headline, button and image silhouettes so website result is recognizable at 340px thumbnail. All important content central 85%.

### portfolio

Use case: ui-mockup. Asset: 16:9 landscape website-result thumbnail for Korean beginner web course. Show a finished bold personal PORTFOLIO WEBSITE as the main subject, unmistakably a web page. Edge-to-edge flat website screenshot, tiny top navigation and restrained browser-like address header; no device mockup, no desk. Near-black canvas and warm off-white heavy clean typography. Exact large English heading "SELECTED WORK" at upper left, understated navigation "ABOUT WORK CONTACT" at upper right. Main area is an asymmetrical visually stunning grid: one oversize project tile left with a dramatic black-and-white architectural facade photo, one smaller upper-right tile showing a tangible orange/ivory editorial print design, one small lower-right tile showing a simple mobile website screen. Small project labels "01 / SPACE" "02 / EDITORIAL" "03 / WEB", slim divider lines. Work images clearly embedded in website grid with generous breathing room, orange only tiny accent arrow, not huge colored background. Contemporary independent creative portfolio, photographic project imagery, sharply structured, not a teaching deck or typography-only poster. No ratings, clients, fake job titles, metrics, awards, or purchase functions. Large work tiles dominate and remain distinct when reduced to 340px. Page layout must be entirely different from a service landing hero and from a personal journal.

### personal

Use case: ui-mockup. Asset: 16:9 landscape website-result thumbnail for Korean beginner web course. Show a completed distinctive PERSONAL JOURNAL WEBSITE about favorite places discovered walking. Website fills the frame; one thin browser bar and minimal navigation make it clearly a web result. Soft warm white page with deep charcoal type and muted green photographic accents. EXACT large Korean title "나의 작은 발견", small English masthead "A WALKING JOURNAL". Original magazine-like asymmetric layout: large portrait-oriented sunlit alley photograph on left occupying 40%, on right two smaller rectangular photos of an interesting garden corner and a bookshop entrance with short readable Korean captions "골목에서" and "잠깐의 쉼". Small date-like numbers and hairline rules, generous white margins, navigation "기록 장소 소개", tiny orange underlined link "기록 보기". All photographs are INSIDE webpage content, no people holding cameras, no desk, no notebook mockup, no map pins, no commerce. Make this a desirable contemporary small independent web journal, not a collage poster, lesson cover or photo workshop advertisement. No gradients, glows, drop shadows, decorative 3D, thick rounded panels. Clear masthead/navigation/link/photo cards establish website structure even at340px thumbnail. No claims of actual student results.

## 사용자 승인 뒤 적용

2026-10-15 사용자 ‘워크북도 일단 이대로 진행’ 승인 전달로 홈/클래스의 WorkbookExamples 기본값에 v2를 적용했다. 위의 본편미적용 설명은 후보제작 당시 이력이다. 기존구성은 legacy 옵션으로 비교페이지에 유지한다. 적용검증은 workbook-home-options.md의 ‘승인된 v2 썸네일 본편 적용’을 따른다. 실제카드/모바일 시각검수는 여전히 미완료다.
