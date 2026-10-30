# 카피바라 작업실 원화 시안 01

2026-10-17. 사용자 요청: 사진 위에 독립 소품을 얹는 합성 대신 방·가구·소품의 시점과 크기를 통일하고 카피바라가 생활하는 방을 디자인한다.

- 도구: 내장 `image_gen` (CLI/API fallback 사용 안 함).
- 결과: `public/images/workbook/room/studio-concept-v1.png` (1536×1024).
- 적용: 홈 작은 진입 카드 및 큰 작업실 모달의 ‘새 공간 시안’.
- 구성: 고정된 약간 높은 3/4 시점의 두 벽·나무 바닥. 중앙 책상/카피바라, 왼쪽 창가 휴식, 오른쪽 수납·기념품. 따뜻한 목재와 천, 오후 조명, 절제된 주황색. 클래스 픽셀 풍경을 액자에 표현.
- 통합된 한 장의 원화다. 실제 획득/배치 상태가 그림에 반영되거나 카피바라가 움직이는 기능이 아니다. 기존 수집·배치 구조 실험과 별도 탭으로 구분한다.
- 후속: 같은 카메라·접지선·빛으로 방/책상/의자/카피바라/소품 레이어를 제작하고 가림 순서와 배치 가능 면을 정의한다. 현재 원화를 임의로 잘라 독립 자산처럼 사용하지 않는다.

## 최종 생성 프롬프트

Use case: stylized-concept. Asset type: integrated room concept art for Motivo workbook's capybara workspace, landscape 3:2. Create a beautifully art-directed warm hand-painted architectural cutaway illustration of one small lived-in creative studio, viewed from a fixed slightly elevated three-quarter orthographic camera. A coherent complete room on a dark muted forest-green canvas, two walls and wooden floor clearly visible, all furniture and props share exactly the same perspective, scale, light direction, ground contact and painterly material language. An adult-friendly, sophisticated editorial illustration, tactile wood and linen, cinematic amber afternoon light from a large window, restrained burnt orange details, NO plastic toy 3D render, no photographic collage. A small adorable anatomically recognizable capybara lives here: seated naturally on a low cushioned chair at a wooden desk working on a laptop, paws reach the desk, body proportion and furniture scale believable; no sunglasses, no human hands. Desk with a notebook, ceramic tea cup, small task lamp; right wall compact shelves with a few books and a keepsake storage drawer; a framed tiny abstract pixel landscape on wall links to a learning adventure; modest leafy plant near window, folded blanket on a low lounge chair, worn woven rug. Let the floor remain visibly usable and leave some shelf space empty so future decorating is conceivable. Not cluttered. Character occupies about 12 percent of room width, room is the subject, relaxed lived-in atmosphere with evidence of study and rest. Entire room bounded within image with breathing room, no cropped furniture, no UI, no labels, no numbers, no text, no logos. This is a unified visual design proposal, not an asset sheet; render the room and capybara together.
