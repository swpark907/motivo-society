# 워크북 클래스 썸네일 · 2026-10-16

## 어깨 너머 구도 · 게임 카드 적용

사용자 요청으로 카피바라 크기를 줄이고 어깨 너머로 제작 화면을 보는 B구도를 추가했다. [구도 템플릿 A/B](workbook-thumbnail-compositions.md).

후보 파일: `public/images/workbook/candidates/class-game-shoulder-v1.png` (1672×941). 내장 image_gen으로 기존 게임 썸네일을 참조해 제작했다. 이후 사용자 승인으로 게임 카드 이미지를 이 후보로 교체했다. 홈 캐러셀과 전체 격자 목록은 같은 카드 정의를 사용한다. 원본 검수에서 카피바라가 작은 왼쪽 아래 전경으로 보이고, 모니터가 가려지지 않으며, 섬 게임 에디터·레벨 스케치·바닷가 색감을 확인했다. 축소 시에도 큰 모니터와 작은 캐릭터의 위계가 유지되는 구도다. 원본 검수 후 실제 카드 적용과 시각 검수를 진행했다.

### 어깨 너머 후보 프롬프트

Use case: precise-object-edit. Create an alternative CAMERA COMPOSITION of the supplied seaside capybara GAME DEVELOPMENT class image. Input image is the visual reference/edit target for the same capybara, sunny coastal studio, blue/cream palette, game content and photographic finish. Change camera position to a wider, slightly elevated OVER-THE-SHOULDER shot from behind the capybara. The capybara is noticeably SMALLER in the composition: back of head, one ear and shoulder form a modest foreground shape in lower left, roughly 20–25 percent of image area, not a dominant portrait. Show enough side cheek and ear to unmistakably recognize a capybara, not a generic furry back. The computer screen is the HERO, centrally/right placed, large and almost face-on, completely unobstructed by the head or shoulder, filling roughly 45 percent of the image. Viewer feels they are looking past a companion's shoulder at the work in progress. Monitor displays a credible 2D pixel-art island exploration GAME EDITOR: sandy path, turquoise sea, palm trees, tiny capybara player, slim tileset and layer panels, no website. Desk below contains the hand drawn island level sketchbook, partially visible keyboard and the capybara's paws. Include a little more breathing room and a calm ocean/window background. Preserve bright summer sunlight, natural tan fur, tactile paper, subtle film-grain photographic realism, coherent desk/monitor perspective. This is an intentional reframing, not merely shrinking the same front portrait; clearly look FROM BEHIND and over the shoulder. Landscape 16:9 full bleed. No humans, no 3D-render/cartoon appearance, no duplicated screens, no floating UI, no logos, no large text overlays, no watermark.

## 최신 적용 · 기존 웹 복원 / 앱·게임·영상 후보

사용자 후속 승인으로 웹 클래스는 내부 픽셀 마을과 이어지는 기존 `vibe-web-cover-v1.png`로 복원했다. 아래 최초 바닷가 웹 썸네일 적용 기록은 과거 이력이다. 원본은 보존한다.

| 현재 자산                                                      | 용도                                             |
| -------------------------------------------------------------- | ------------------------------------------------ |
| `public/images/workbook/vibe-web-cover-v1.png`                 | 기존 웹 클래스 표지 복원                         |
| `public/images/workbook/class-app-studio-v1.png`               | 앱 후보 · 스마트폰과 앱 화면                     |
| `public/images/workbook/candidates/class-game-shoulder-v1.png` | 게임 · 어깨 너머 제작 화면                       |
| `public/images/workbook/class-video-studio-v1.png`             | AI 영상 후보 · 장면 미리보기/타임라인/스토리보드 |

게임·영상은 내장 image_gen을 사용했다. 생성 원본 1672×941. 게임 편집은 카피바라·방·구도·햇빛·바다색 유지와 모니터의 게임 에디터/종이 레벨 스케치를 확인했다. 영상은 겨울 저녁 작업실의 영상 프리뷰·연속 장면·오디오 파형을 확인했다. 세 후보 카드는 비클릭 dim/COMING SOON이며 실제 강의·도구 선정·결과 보장이 아니다. 영상 카드는 사용자 답변에 따라 정지 이미지로 먼저 구현하고 영상 전환은 후속 논의한다.

### 검증

PC 1440×1000과 모바일 390×844에서 실제 카드 배치·배지·본문 줄바꿈·썸네일의 제작 화면을 확인했다. 어두운 앱/영상 이미지의 내용이 묻히지 않도록 준비 중 이미지 불투명도를 0.42에서 0.56으로 보정했다. 본문과 배지는 어둡게 하지 않는다. 캡처는 `/tmp/workbook-four-classes-20261016/`에 보관했다. 홈 카드 안내·기존 웹 표지 복원·클래스 소개 이동·목적 변경/소개 왕복 관련 E2E는 PC/모바일 4개가 통과했다. 자체 리뷰에서 기존 클래스 링크·결과 예시·학습 상태 유지와 기획 후보 비클릭/상태 안내를 확인했다. 실제 영상 생성이나 새 클래스 수업 구현은 추가하지 않았다.

### 게임 편집 프롬프트

Use case: precise-object-edit. Edit the provided seaside capybara workstation image. Keep the exact camera composition, 16:9 framing, capybara identity/pose/size, desk and monitor geometry, ocean view, bright summer daylight, blue/cream palette, photographic fur and all surroundings unchanged. Change ONLY the CONTENT ON the large monitor and the open sketchbook on the desk. Monitor: replace the website with a credible 2D GAME DEVELOPMENT editor, large central pixel-art coastal exploration game viewport with a little capybara player on a sandy island path, turquoise sea and palm trees, a narrow tile palette on one side and object/layer panel on the other, restrained editor toolbars. Clearly a game level being made, not a website, no browser navigation or web project cards. Sketchbook: replace web wireframes with hand-drawn top-down island game level map, dotted player path, tiny character sprite studies and interaction sketches. No 'WEB PAGE DESIGN' words; use small 'LEVEL DESIGN' header only if lettering is necessary. Preserve the sketchbook size/perspective and paper texture. Do not redesign the room, shift camera, move the capybara, alter palette, add hardware, add text overlays or watermark. Output one full-bleed image.

### 영상 생성 프롬프트

Use case: photorealistic-natural. Asset: cinematic premium editorial photograph for an AI VIDEO CREATION class thumbnail, landscape 16:9. A lifelike friendly capybara works at a grounded real video editing workstation in an atmospheric small film studio at dusk. Three-quarter side view, capybara on left, large desktop monitor on right both prominent. Monitor shows unmistakable video-making workflow: a LARGE cinematic preview of a tiny train crossing a snowy mountain valley, a row of three sequential shot/storyboard thumbnails of that same scene, and a multitrack editing timeline with video clip strips and an audio waveform beneath. A paper storyboard with three hand drawn frames is on the desk. A small desktop control surface and modest studio light in background, no excessive props. Winter lavender dusk through the window, soft neutral studio light on natural tan fur, slate and muted rose palette distinct from blue app studio and sunny seaside. Photographic fur, real paper and glass, subtle film grain, elegant realistic editorial storytelling. No humans, no robots, no futuristic holograms, no 3D-render/cartoon look, no floating film strips, no brand names, no captions/text overlays, no watermark. Clear simple silhouette readable at card size, key subjects centered in safe frame. Screen should communicate editing/creating video rather than coding a website or mobile app. Single full-bleed image.

## 최초 생성 이력

내장 image_gen으로 생성했다. 실사 질감의 카피바라와 제작 화면을 함께 보여주고, 클래스 내용과 연결되는 장면을 우선한다. 생성 이미지 속 UI는 설명용 장면이며 실제 수강 결과나 확정된 앱 기능·지원 플랫폼을 뜻하지 않는다. 홈 클래스 카드에만 적용한다.

| 파일                                              | 장면                                             |
| ------------------------------------------------- | ------------------------------------------------ |
| `public/images/workbook/class-web-seaside-v1.png` | 여름 바닷가 작업실 · 웹페이지 화면과 구성 스케치 |
| `public/images/workbook/class-app-studio-v1.png`  | 푸른 도시 작업실 · 앱 화면과 스마트폰 확인       |

두 원본 모두 1672×941. 카피바라·화면·과정 단서가 함께 보이는지 원본을 확인했다. 앱 카드의 dim과 COMING SOON은 HTML/CSS로 제공한다. PC·모바일 실제 화면 디자인 검수는 별도 승인 후 진행한다.

## 웹페이지 프롬프트

Use case: photorealistic-natural. Create a premium cinematic editorial photograph for a Korean AI web-page-making class card, wide landscape 16:9. A lifelike charming capybara sits at a real desk in a bright summer seaside studio, three-quarter side view, using a desktop monitor and keyboard. The large monitor clearly displays a polished personal website inside a browser: hero photo, large heading shapes, three project cards, visible browser chrome; a paper page-layout sketch beside the keyboard makes WEB PAGE DESIGN unmistakable. Ocean blues, cream walls, natural tan fur, subtle film grain, believable sunlight and photographic textures. Capybara and screen both large readable focal subjects even at thumbnail size. No humans, no 3D-render/cartoon look, no orange color cast, no floating holograms, no logos, no text overlays, no watermark. Keep important subjects inside central 80%. Single full-bleed image, no borders.

## 앱 프롬프트

Use case: photorealistic-natural. Create a premium cinematic editorial photograph for a Korean AI app-development class card, wide landscape 16:9. A lifelike charming capybara at a real workstation in a restrained near-future blue-hour city studio, three-quarter side view, one paw testing an upright smartphone on a stand while looking at a large monitor. The monitor prominently shows THREE mobile app screens side by side (list screen, item detail screen, add-item form) in a grounded app prototyping/development interface. Phone shows the same simple task-list app, making APP BUILDING AND TESTING unmistakable. Cool blue and violet city reflections with restrained cyan accents, natural tan fur, subtle film grain, realistic materials and cinematic photography; sophisticated, approachable, not aggressive sci-fi. Screen and capybara large clear focal subjects at thumbnail size. No robots, no humans, no 3D-render/cartoon look, no orange wash, no floating holograms, no logos, no text overlays, no watermark. Keep subjects in central 80%. Single full-bleed image, no borders.
