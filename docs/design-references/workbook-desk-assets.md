# 책상 실험 아트 에셋

## 완성 시안 기반 재제작 (현재 적용)

`room-v3.png`는 완성 시안 `ref-workbook-desk-finished-v1.png`를 직접 참조해 다시 생성했다. 노트북, 포스터, 창가 책 더미, 오른쪽 필기구, 전경 지도와 펜을 복원하고 중앙 조작 여백을 확보했다. 현재 장면에는 v3를 사용하며 이전 버전은 비교용으로 보존한다.

프롬프트: Use case: precise-object-edit / production game background. Input image is the approved web mockup. Recreate ONLY the large left artwork panel as a standalone background image, no surrounding webpage. Match this reference scene extremely closely in composition, character identity, photographic detail and cinematic warm light: large cute broad flattened-face capybara in black hoodie and sunglasses upper left-middle, both paws resting on back edge of desk; open laptop with subtle playful stickers at far left; softly blurred shelves and warm practical lights behind; handwritten poster behind character; sunset mountain window upper center-right; stacked dark books below window; black amber desk lamp upper right; several cream and dark pencil holders at right; dark book stack foreground right; postcards, illustrated travel map and fountain pen foreground left; small soft out-of-focus leaves in lower left corner. Rich amber highlights, dark brown wood, realistic fur and tactile materials, premium harmonious photograph-like illustration exactly like the reference, NOT the previous empty-room interpretation. Required change: remove the three interactive central objects (orange notebook, tea cup, pothos plant), all their shadows, all dotted guides, speech bubble, arrows, badges and UI labels. Expand clean working wood area modestly for an interactive lesson: keep x=17%-86%, y=44%-87% clear, while retaining convincing dense props on extreme margins and rear edge. Character occupies upper 40%, desktop lower 60%. Do not replace left laptop with giant book piles. Do not remove peripheral composition. Match the reference camera and perspective, gently elevated looking down, warm lamp from upper right casting soft shadows toward lower left. Output landscape 3:2, full bleed 1536x1024. No UI or watermarks. Small incidental decorative writing can be subtle and illegible.

## 생활감 있는 작업실 수정

사용자 피드백에 따라 `room-v2.png`를 현재 배경으로 사용한다. 기존 `room.png`를 편집해 가장자리의 책 더미, 메모, 필기구와 돌 조형물을 추가했다. 중앙은 조작 공간으로 유지한다. 원본은 비교용 및 목표 미리보기 배경으로 보존한다.

프롬프트: Edit this exact warm capybara desk background. Preserve capybara face, sunglasses, hoodie, sunset window, lamp, photographic texture and camera angle. Make the desktop feel lived-in: substantial stacks of worn books at left edge foreground and rear-left, loose handwritten notes and pencils at the rear edge, pen holders and a small sculptural stack of smooth stones on the right edge. Add a coiled cable and a few paper slips near outer corners. Keep central desktop clear for separate interactive objects: rectangle x=18%-82%, y=43%-88% must remain empty wood. Peripheral objects should visibly frame this clear area, not cover it. Keep face unobstructed. No new cups or plants or orange notebooks in central space. Landscape 1536x1024, no UI, no readable text. Maintain original composition.

2026-09-28. 승인된 `ref-workbook-desk-finished-v1.png`를 공통 참조로 imagegen에서 생성했다. 배경과 투명 소품을 분리하여 실제 Flex 조작이 가능하도록 구현했다.

| 파일 (`public/images/workbook/desk/`) | 용도                 |
| ------------------------------------- | -------------------- |
| room.png                              | 카피바라 작업실 배경 |
| book.png                              | 투명 배경 노트       |
| cup.png                               | 투명 배경 찻잔       |
| plant.png                             | 투명 배경 화분       |

## 생성 프롬프트

### room.png

Create just the artwork background from the large left scene in reference, no webpage UI. Landscape 3:2. Cute flattened-face capybara wearing black hoodie and sunglasses sits BEHIND the desk at upper left, paws on distant edge. Warm sunset mountain window, blurred shelves, right overhead amber lamp, pencils and books only at extreme edges. CRITICAL lower 65% is a wide EMPTY wooden desktop free of notebook, cups, plants or objects, ready for interactive object overlays. Capybara entirely in upper 35%. Camera elevated 30 degrees looking down onto desk. Match photographic textured premium art. No text, no overlays, no borders.

### book.png

Create ONE isolated orange fabric notebook matching the reference desk's notebook. Premium photographic textured illustration, warm amber lighting from upper right, viewed from elevated 30 degrees downward, front edge toward camera. Closed orange book with black elastic strap, worn paper edges, subtle tiny embossed decorative marks NO readable lettering. Whole object centered filling 85% square canvas, genuinely transparent background with alpha, no floor, no scene, no UI, no cast shadow outside object, no checkerboard.

### cup.png

Create ONE isolated cream speckled ceramic teacup containing amber tea ON a matching saucer, matching reference. Handle right. Premium photographic textured illustration, warm amber lighting from upper right, elevated 30 degree downward view, same perspective as desk notebook. Whole cup and saucer centered filling 85% square canvas. Genuinely transparent alpha background, no floor, scene, lettering, UI, external cast shadow or checkerboard.

### plant.png

Create ONE isolated small leafy variegated pothos in a warm terracotta pot matching reference. Compact lush leaves, premium photographic textured illustration, warm amber lighting from upper right, elevated 30 degree downward view. Entire plant and pot centered filling 85% square canvas. Genuinely transparent alpha background, no floor, scene, text, UI, external cast shadow or checkerboard.
