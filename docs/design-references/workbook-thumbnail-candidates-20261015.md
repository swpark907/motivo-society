# 목적별 이미지 후보 — 2026-10-15

실제 대상은 별도 강의 세 개가 아니라 동일한 웹개발 클래스의 **서비스 소개·포트폴리오·개인 사이트 구성 예시**다. 최신 `워크북 사용자 여정 논의`의 썸네일 요청 및 `WorkbookExamples`/`workbook-purpose.ts`를 대조했다. 기존 브라우저 프레임·텍스트·두 칸 레이아웃의 반복 대신 장면을 구분한다. 실제 수강 결과나 학습자가 제작한 웹페이지로 표시하지 않는다.

비교 페이지: `/demo/workbook-thumbnails`. 기존 `WorkbookExamples`를 아래에 그대로 렌더링하고 위에는 16:9 이미지 카드 후보를 둔다. 본편 홈·클래스·히어로와 기존 자산은 바꾸지 않았다. 후보의 카드 제목·설명·링크는 기존 예시와 같고 생성 이미지 안에는 제목을 넣지 않았다. 서비스의 가게/메뉴, 포트폴리오의 자기 작업/과정, 개인 사이트의 산책/발견은 실제 목적 예시에서 가져온 소재다. 목공·카페·사진은 예시의 관심 주제이며 이 클래스에서 가구·사업 운영·사진 촬영 기술을 배운다는 뜻은 아니다.

## 생성 방식과 검수 경계

내장 image_gen, 신규3장 + 작은 표식 보정2장. 원본은 `generated_images/`에 보존하고 후보는 `public/images/workbook/candidates/`에 복사한다. 생성 결과를 직접 열어 소재/구도·문자·표식을 확인했다. 전체 check/session15388은 9파일20테스트 통과. 실제 브라우저 검수는 수행되지 않았다: 이 실행 환경 CUA `getState`가 앱/브라우저 빈 목록 및 Sky service startup 오류를 반환했다. 별도 브라우저/스크린샷 방식으로 우회하지 않았다. 따라서 카드에서의 실제 초점·잘림·모바일 대비 및 링크 조작 E2E는 미검증이다. CSS는 넓은PC3열/중간2열/모바일1열과16:9로 준비했으며 실제 렌더 확인과 구분한다.

채택 전 부모의 지원되는 로컬 CUA에서 `/demo/workbook-thumbnails`를 PC1440과 모바일390으로 열어 제목/이미지 초점/잘림·가로넘침·기존안 대비를 확인한다. 상단 후보가 호기심을 높이는지, 웹페이지 만들기보다 카페/목공/사진 수업으로 읽히는지 사용자 판단이 필요하다. 후자가 강하면 웹페이지 결과와의 연결을 보강할 후보로 재제작하며 그대로 본편에 넣지 않는다. 공개 배포/커밋 없음.

## 신규 생성의 원문 프롬프트

### service

Use case: photorealistic-natural. Create a cinematic editorial website thumbnail, landscape 16:9. For a Korean beginner web course's example SERVICE INTRODUCTION page, NOT an ecommerce service or completed student work. A young adult independent neighborhood cafe owner seen from shoulder behind at the open counter, hands arranging a hand-written simple menu beside one beautiful ceramic coffee cup, tiny intimate shop window and morning street beyond. Close and bold: hands and cup occupy center foreground, owner's face partially visible at left, shallow depth, diagonal counter leading into shop. Authentic small beginnings, tactile, human, desirable contemporary magazine photography. Warm restrained orange accent in an apron strap, deep charcoal and natural warm whites, film grain, realistic photography. No text, no logos, no typography, no UI, no browser frame, no collages, no 3D illustration, no gradients, no fake earnings, no payment or booking UI. One clear focal subject readable at 340px width. Keep essential subjects in central 75% safe area.

### portfolio

Use case: photorealistic-natural. Cinematic editorial landscape 16:9 thumbnail for a beginner's personal PORTFOLIO webpage example, communicates their own work and process, not job placement promises. Dramatic top-down overhead photographic scene of young adult's real hands selecting three large printed photographs of an actual handmade small wood chair prototype and sketch development on a matte near-black studio table; one pencil annotated sketch (marks not legible text), one finished small wood chair visible at top edge, cropped forearms, paper off-white, orange pencil as tiny accent. Strong graphic diagonal from hand to large prototype photograph. Authentic creative practice, stylish design magazine art direction, tactile physical evidence of work rather than a classroom. High contrast real photography, restrained warm light, slight film grain, enough negative dark space but subject big. No words or logos, no typography, no UI, no browser, no desktop monitor, no AI sparkles, no 3D render. All core subject in center safe area for small 340px cards.

### personal

Use case: photorealistic-natural. Cinematic editorial landscape 16:9 thumbnail for a beginner PERSONAL WEBSITE about places discovered on walks and things they genuinely love. Intimate eye-level close photograph: a young adult photographer seen in profile holding a small camera to photograph a sunlit quiet urban garden through weathered window opening, vivid subject is their curious face and hands at right foreground with soft green leaves and warm light in middle background. Distinct outdoor experiential composition, not a desk, not a shop, not a lesson. Candid human discovery, soulful contemporary independent magazine photography; charcoal shadows, muted natural green, warm white, tiny orange camera wrist strap, subtle film grain. No text, no logos, no UI or browser frame, no collage, no map pins, no glitter, no 3D illustration. Clean bold focus reads at 340px width; important elements in central75% safe area.

## 표식 보정 원문

Use case: precise-object-edit. Remove only the tiny artificial logo-like mark in the [top right / bottom right] corner. Fill naturally with the adjacent photographic background. Preserve the entire original photo, subject identity, hands, camera or cup, lighting, crop, composition, dimensions and textures exactly. No new text, marks, logos, borders or other changes.

service는 top right, personal은 bottom right. 각 생성 원본을 referenced_image_paths로 입력했다.

## 자산 매핑

| 용도        | 생성 원본                                                                                               | 최종 후보 파일                                               |
| ----------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 서비스      | exec-d5a5cd7c-d75b-466a-b8ce-06f7874edefe.png → 표식 보정 exec-657c0a9a-2bf9-42ff-b554-308db3d392c4.png | public/images/workbook/candidates/service-editorial-v1.png   |
| 포트폴리오  | exec-01d974f2-2d95-47a5-ba54-fc75c4254179.png                                                           | public/images/workbook/candidates/portfolio-editorial-v1.png |
| 개인 사이트 | exec-1c6a0cff-d4e1-4361-b935-cd14a4fa7018.png → 표식 보정 exec-7f09d08d-536c-4c4a-a7cf-e31f94742ecd.png | public/images/workbook/candidates/personal-editorial-v1.png  |

생성 원본 경로는 저장소의 `generated_images/` 기준이다. 보정 결과를 직접 열어 구석 표식 제거와 주 피사체/구도 유지 확인. 서비스의 인물/메뉴와 개인의 얼굴/카메라, 포트폴리오의 스케치/작업 사진 구분은 원본 이미지에서 확인했으며 작은 카드 렌더와 동일한 검증은 아니다. 사용자3000/PID21774 서버는 종료하지 않았다.
