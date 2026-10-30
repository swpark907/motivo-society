# 작업실 레이어와 독립 액션

2026-10-17. 내장 `image_gen`으로 승인된 `studio-concept-v1.png`를 참조해 생성했다. CLI·Python 이미지 편집·자동 마스킹은 사용하지 않았다. 생성본을 그대로 프로젝트에 복사했다. PNG alpha 채널과 실제 브라우저 합성을 확인한다.

공통 경로: `public/images/workbook/room/layers/`.

| 자산             | 역할                                                   |
| ---------------- | ------------------------------------------------------ |
| room-base-v1.png | 창·벽·바닥·러그·고정 벽 그림. 1536×1024                |
| furniture-v1.png | 책상·의자·선반·소파·작은 테이블·화분. 투명 전체 캔버스 |
| capy-work-v1.png | 작업 자세, 투명 캐릭터                                 |
| capy-read-v1.png | 책 읽는 자세, 투명 캐릭터                              |
| capy-rest-v1.png | 쉬는 자세, 투명 캐릭터                                 |
| notebook-v1.png  | 독립 기획 노트                                         |
| cup-v1.png       | 독립 머그                                              |
| lamp-v1.png      | 독립 스탠드                                            |

카메라·조명·스타일은 원화의 약간 높은 3/4 시점과 오후의 따뜻한 손그림을 따른다. 생성 레이어라 원화와 모든 픽셀이 정확히 일치하는 추출본은 아니다. 베이스/가구는 전체 좌표를 맞추고 캐릭터/소품은 각각 위치·크기를 보정했다. 접지와 소품별 원근의 추가 미술 보정은 가능하며, 자유 배치마다 조명·그림자를 재계산하지 않는다.

## 생성 프롬프트 세트

모든 호출의 참조 이미지: `public/images/workbook/room/studio-concept-v1.png`. base만 transparent_background=false, 나머지 true.

### 방 배경

Edit target: the attached room concept. Create the architectural BACKGROUND layer for a layered interactive room. Keep the EXACT 1536x1024 canvas, original camera, room silhouette, wall corners, floor outlines, window, curtains, sunlight, rug and hand-painted material style unchanged. REMOVE ALL capybaras, desk, desk chair, laptop, tasklamp, bookcase/shelves and their contents, lounge chair, small table, pouf, all floor-standing pots and furniture. Inpaint the revealed architecture and floor naturally. Keep the wall sunset painting, hanging plants and window scenery. Absolutely no furniture or character or movable small props remaining. Same warm light, forest-green outside canvas. No UI no text. This is a matching base layer, NOT a redesigned room.

### 가구

Edit target: attached room concept. Create the isolated FURNITURE layer matching this exact scene. Exact same 1536x1024 full canvas registration: retain furniture at EXACT original locations and original scale, no recentering no zoom. Keep only the wooden desk, desk chair, laptop on desk, empty tall right shelving unit, left lounge chair with its orange cushion and draped blanket, small round side table, woven pouf, floor-standing large plant near left window. Remove the capybara entirely and remove all small collectible props (books, mugs, loose notebooks, storage drawers, decorative figurines and small potted plants), also remove task lamp from desk. Furniture surfaces and shelves should be bare apart from laptop and fixed cushion/blanket. Everything else must be genuinely transparent including all walls, windows, floor, rug, outside scene. No rectangle background or checkerboard baked in. Preserve hand-painted warm amber lighting and perspective. Full-canvas transparent layer, do not crop/rearrange furniture.

### 작업 캐릭터

Extract ONLY the capybara from the reference as an isolated game-character sprite. Same painterly brown fur, same warm sunlight from upper left, same elevated 3/4 camera. Pose: sitting upright facing right, forepaws extended forward as if typing on a laptop; hind legs tucked under seated body. No chair, no desk, no laptop, no other objects, no scenery, no shadow glow. The entire body and all paws must be drawn, including body parts hidden by original chair. Tightly framed single capybara centered with small transparent padding; character fills 85 percent height. Fully transparent background everywhere outside the animal, no black or brown background. NOT full-room canvas. Warm hand-painted editorial illustration matching reference. No text.

### 독서/휴식 캐릭터 공통 프롬프트

Create isolated character sprite matching the reference capybara's identity, warm brown fur and warm hand-painted editorial style. [POSE] Elevated three-quarter orthographic camera matching reference room. Upper-left amber afternoon light, subtle shading within fur. Tightly framed single animal centered with small transparent padding, animal fills 85 percent image width. Genuinely transparent background, no ground plane, no room, no drop shadow halo, no black/brown background, no text. These are separate still action sprites for the same capybara; not an animation strip.

독서 POSE: A single capybara sitting on its haunches on the floor reading an open small cream-colored book held in its front paws, looking down calmly. Full body visible. Facing slightly toward camera and right. No furniture.

휴식 POSE: A single capybara curled up resting with eyes gently closed, lying on its belly with short paws tucked forward, facing slightly toward camera and right, relaxed natural capybara anatomy. Full body visible. No furniture no pillow.

### 소품 공통 프롬프트

Isolated collectible prop for the attached hand-painted capybara room: [SUBJECT]. Match reference warm painterly wood-and-linen illustration, soft afternoon sunlight from upper left and same camera. Render ONLY this one object, centered, object fills 75 percent image, small transparent padding. True transparent background outside object, no desk/table surface, no room, no black/brown backdrop, no ground shadow or glow. Full object visible, no clipping, no logos, no UI. Asset will be freely placed on room furniture.

- 노트 SUBJECT: a closed small warm orange linen notebook with an elastic band lying flat on a wooden desk, viewed from elevated three-quarter orthographic camera, spine toward lower left, top face visible, no text
- 머그 SUBJECT: a small cream ceramic tea mug filled with amber tea, handle on right, viewed from elevated three-quarter orthographic camera with ellipse rim, no saucer no text
- 스탠드 SUBJECT: a small muted dark sage-green metal desk lamp with a brass round base, curved stem and downward task shade, warm amber bulb, viewed from elevated three-quarter orthographic camera, no visible light beam or glow halo
