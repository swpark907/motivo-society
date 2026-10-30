# 고정 자리 작업실 — 2026-10-17

후속 수정: 의자·몸·손·책상 접촉 문제를 해결하기 위해 작업 자리와 독서 자리는 [완성된 접촉 세트](contact-sets.md)로 교체했다. 아래 독립 레이어 제작 기록은 초기 시안 이력이다.

사용자 선택 기준은 `../workbook-character-v4/selected-character-sheet.png`다. 둥근 검은 선글라스·검은 넥타이·갈색 카피바라를 따른다. 자산은 `public/images/workbook/room/slots/`에 저장했다. built-in image_gen 제작.

방 하나 + 고정 자리 5개(책상 도구·책상 한쪽·벽·바닥 한쪽·휴식 공간), 소품 7개. 책상 도구와 벽은 2종 교체, 나머지는 배치/보관. 액션은 작업·독서·쉬기의 독립 정지 장면. 방문 메모리 저장만 사용하고 실제 수집 보상이나 회원 데이터와 연결하지 않는다.

전체 캔버스 PNG의 알파 영역을 읽어서 측정했고 파일 자체의 크롭·가공은 하지 않았다. 생성물이 지시한 원래 좌표 대신 중앙에 나온 경우 CSS로 배율과 위치를 맞췄다. `roomArt`의 box는 원본 불투명 영역, place는 방 안의 고정 위치다. 쿠션 → 캐릭터 → 책상 소품 순서로 합성한다. 정식 에셋 제작 시에는 원본 카메라·빛·앵커·가림 순서를 고정하고 의자 접촉부를 함께 검수해야 한다. 모든 가구를 임의 교체하거나 캐릭터가 실제로 이동하는 시스템은 아니다.

## 배경 프롬프트

검수: PC 1440×1000, 모바일 390×844에서 소품 합성과 독서·작업·쉬기 장면 확인. 쿠션의 캐릭터 앞 겹침을 수정했다. 모바일의 고정 방 화면이 수집품 클릭을 가리는 문제를 실제 E2E에서 발견해 모바일 고정을 해제하고 ‘방 보기’를 추가했다. 작업실 관련 Playwright 14개(PC·모바일)가 통과했다. 자체 코드 검토에서 상태 복제·취소·닫은 뒤 방문 유지·고정 슬롯 호환성을 확인했다. 선택 캐릭터의 정식 애니메이션이나 가구 자유 교체는 이번 범위가 아니다.

```text
Use case: stylized-concept. Create room base illustration for modular capybara workspace. Reference image 1 room: retain exact elevated threequarter cutaway two-wall perspective, warm late afternoon light from left window, wood floor, rug, wooden desk back center-right, lounge armchair left, shelving right, dark forest green outside. Refine to a cleaner curated adult creative studio, soft dimensional illustrated textures. NO CHARACTER anywhere. Important empty sockets for later transparent overlays: desk top entirely clear; wall above desk blank cream with NO framed art; floor right foreground empty for plant; lounge armchair has cream cushion only, NO blanket or orange cushion. Books on right shelf okay but no tiny figurines. Desk chair EMPTY and desk with clear leg space visible. Keep five visibly empty placement zones and generous floor center. Landscape 1536x1024 composition, no text, no UI. Reference 2 defines future character scale only, do not include character in this base.
```

## 투명 레이어 공통 프롬프트

```text
Use case: compositing. Produce a TRANSPARENT PNG overlay for reference room image1. Exact SAME landscape canvas and camera as room. Everything transparent except requested object and soft localized contact shadow. Do not include room/background/floor/walls, NO opaque rectangles, NO checkerboard. Object must be positioned precisely in the stated location on the full room-sized canvas, same perspective elevated threequarter and warm light from left. Cohesive soft dimensional illustration.
```

### laptop.png

```text
An open silver laptop on desk left-center, screen facing viewer-left chair. Object bounding area approximately x55-64%, y32-41% of canvas. Perspective matches desktop plane.
```

### notebook.png

```text
An open cream sketchbook with pen resting across it on desktop left-center x55-64%,y36-41%. Same desk plane.
```

### cup.png

```text
A small cream ceramic coffee cup and saucer, on right end of desk, x67-71%,y39-43%.
```

### poster.png

```text
A medium framed abstract sunset landscape, dark wood frame, hung on wall above desk x56-66%, y16-29%. Frame perspective matches right wall.
```

### print.png

```text
A medium framed minimal botanical art print, cream paper dark olive leaf shapes, dark wood frame, wall above desk x56-66%,y16-29%. Perspective matches right wall.
```

### plant.png

```text
A small leafy rubber plant in terracotta pot on floor in front of right shelf. x80-89%,y55-72%. Include subtle floor contact shadow.
```

### cushion.png

```text
A rust orange linen throw cushion resting naturally on left lounge chair cream backrest, x18-25%,y52-61%. Match seat angle and perspective. No chair included.
```

### work.png

```text
Use reference2 for exact original capybara identity: round black sunglasses WORN on eyes, black necktie, NO other clothes, soft brown upright pear body, tiny dark paws. Seated at desk chair facing right toward desktop, hands reaching desktop, warm rim light. Character approximately x49-59%,y29-50%. Include only capybara parts visible IN FRONT of existing desk chair, no chair redraw, no desk redraw. Character bottom naturally meets chair cushion. Keep room original canvas.
```

### read.png

```text
Use reference2 exact original capybara: round black sunglasses WORN on eyes, black necktie, NO other clothes, soft brown pear body, tiny paws. Seated on lounge armchair holding small open book. Character x17-29%,y46-67%. Legs resting toward front, torso against cream cushion. Include only character and book, no chair, no background. Original full room canvas.
```

### rest.png

```text
Use reference2 exact original capybara: round black sunglasses WORN on eyes, black necktie, NO other clothes, soft brown pear body. Sitting comfortably on central rug with legs forward, tiny paws on belly, as seated pose on character sheet. Character x44-57%,y59-79%. Soft localized contact shadow under bottom, original full room canvas. No rug or floor included.
```
