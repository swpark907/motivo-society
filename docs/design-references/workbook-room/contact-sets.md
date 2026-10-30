# 가구·캐릭터 접촉 세트 — 2026-10-17

사용자 피드백: 의자 위 캐릭터와 책상 밖으로 나온 노트북이 어색했다. 이를 독립 소품 좌표 조정으로 해결하지 않고 가구·캐릭터·도구를 함께 제작하도록 변경했다.

## 합성 방식

- 작업 자리 6종: 작업/빈 의자 × 노트북/노트/빈 책상.
- 독서 자리 4종: 독서/빈 의자 × 쿠션 있음/없음.
- 작업과 독서에는 별도 캐릭터 레이어를 얹지 않는다. 쉬기는 기존 바닥 캐릭터를 유지한다.
- 벽 액자·화분·컵은 독립 소품이다. 수집함 UI와 저장/취소는 유지한다.
- 기준 배경을 그대로 유지하고, 해당 가구 영역을 완성된 국소 장면으로 덮는다. 배경 가구를 별도 제거한 투명 PNG는 아니다. 원본 프레임을 보존한 전체 캔버스 파일에서 CSS 마스크로 필요한 자리만 표시한다. 가구·몸·손·도구의 접점은 한 그림 안에 있고 방과 만나는 외곽 경계만 알파 마스크로 합성한다. 모든 소품 조합의 방 배경을 만들지 않는다.
- `public/images/workbook/room/slots/sets/`에 저장했다. `desk-idle-empty.png`, `lounge-idle-plain.png`는 기존 base.png를 그대로 사용하는 빈 가구 상태다. 나머지 8종은 built-in image_gen으로 제작했다. 원본 이미지 후처리·코드 크롭을 하지 않았다.
- 기존 개별 work/read/laptop/notebook/cushion 자산은 탐색 이력·수집함 썸네일 용도로 보존하며 새 방의 작업·독서 접점 합성에는 사용하지 않는다.

## 1차 접촉 장면 공통 프롬프트

검수: PC 1440×1000, 모바일 390×844에서 작업/독서 접점과 방 경계를 확인했다. 모바일의 relative 요소에 남아 있던 top 오프셋도 제거했다. 자체 코드 검토에서 도구 선택·빈 의자 전환·단일 캐릭터·쿠션 보관·저장/취소를 확인했다. Playwright PC·모바일 2개 여정 테스트에 세트 선택과 쿠션 없음 이미지 로드 검증을 추가해 통과했다. 원화 간 미세한 질감 차이는 남을 수 있으며 현재 고정 카메라의 제한된 장면 교체 시안이다.

```text
Use case: precise-object-edit. Edit reference1 room image IN PLACE. Preserve exact 1536x1024 full room framing, elevated cutaway camera, every wall/window/shelf/floor/rug pixel outside requested furniture region, same warm light and painterly dimensional style. Reference2 defines exact capybara mascot: soft brown pear body, round BLACK sunglasses worn on eyes, BLACK necktie, tiny paws/feet, NO other clothes. Integrate physically naturally at furniture scale. Maintain original furniture positions, angles and proportions. No new scene crop or zoom. No UI/text.
```

### desk-work-laptop

```text
Change ONLY back center-right desk region: seat capybara correctly ON the existing wooden desk chair, pelvis supported by cushion, back against chair backrest; small feet naturally hang below cushion. Desk front edge occludes lower body appropriately. Both paws rest naturally on silver laptop keyboard. Laptop sits ENTIRELY WITHIN wooden desktop with generous visible wood on ALL sides, especially FRONT edge; laptop base flat flush on desktop plane, screen facing capybara. Right half of desk EMPTY, NO CUP. Single cohesive desk+chair+character+laptop illustration. Entire assembly contained x46-75%,y26-64%. Keep wall above desk blank.
```

### desk-work-notebook

```text
Change ONLY back center-right desk region: seat capybara correctly ON existing wooden desk chair, pelvis supported on cushion, back against backrest, feet hang naturally. Both paws naturally interact with open cream notebook and pen on desktop, writing pose. Notebook ENTIRELY WITHIN desktop, plenty visible wood front edge and sides, flat flush perspective. Desk front occludes lower body appropriately. Right desktop EMPTY, NO CUP. Cohesive desk+chair+character+notebook set contained x46-75%,y26-64%. Wall above stays blank.
```

### desk-work-empty

```text
Change ONLY back center-right desk region: capybara sitting correctly ON existing wooden desk chair with body supported on cushion/backrest, tiny feet hanging naturally below. Paws resting comfortably together on its lap, looking at EMPTY desk. Entire desktop empty, NO LAPTOP, NO NOTEBOOK, NO CUP. Cohesive desk+chair+character set contained x46-75%,y26-64%. Wall above blank.
```

### lounge-read-cushion

```text
Change ONLY LEFT lounge armchair region x13-34%,y44-74%: capybara sits properly deep IN the existing lounge armchair READING an open small green hardcover book held in both paws over lap. Pelvis supported on seat cushion and back resting against backrest; legs dangle naturally over front seat edge. Existing wood armrests naturally occlude sides of body, not pasted in front of chair. Add ONE small rust orange throw cushion tucked BEHIND capybara back, cannot cover face/book/body. Cohesive chair+character+book+cushion set, include natural contact compression/shadows. Keep original side table and neighboring plants unchanged. No capybara elsewhere in room.
```

## 빈 가구·쿠션 상태 파생 공통 프롬프트

```text
Use case: precise-object-edit. Edit this FULL ROOM image with exact same framing, camera, resolution and lighting. Keep all geometry and all objects pixel-aligned. Change ONLY specified element; preserve all other pixels. No crop/zoom/text.
```

### desk-idle-laptop (참조: desk-work-laptop)

```text
REMOVE ONLY capybara and black tie/sunglasses at desk, restore empty chair cushion/backrest behind its body. Preserve laptop exact size, placement, orientation, screen and shadow, preserve desk/table/chair original position. No character anywhere.
```

### desk-idle-notebook (참조: desk-work-notebook)

```text
REMOVE ONLY capybara and black tie/sunglasses at desk, restore empty chair cushion/backrest. Preserve notebook and pen on desktop exact size, placement, perspective and shadow. Preserve desk/table/chair position. No character anywhere.
```

### lounge-read-plain (참조: lounge-read-cushion)

```text
REMOVE ONLY small orange throw cushion BEHIND capybara in left lounge armchair. Restore cream chair upholstery where cushion was visible. Keep capybara reading book, exact body position, chair, armrest occlusion, book, tie, sunglasses, every other room detail unchanged.
```

### lounge-idle-cushion (참조: lounge-read-cushion)

```text
REMOVE ONLY capybara and book from left lounge armchair. Restore empty cream chair seat/backrest with orange throw cushion still resting against backrest. Keep chair exact position/size/shape, all furniture, room, light, every other detail unchanged. No character anywhere.
```
