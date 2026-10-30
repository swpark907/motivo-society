# 작업실 리소스 관리와 테마 확장 — 2026-10-17

## 이번 적용

- 나무 작업실 + 도시 작업실 2종. 도시 테마는 월넛 가구·세이지색 의자·그레이 벽·차분한 러그와 도시 풍경을 묶은 프리셋이다. 벽/바닥/가구를 무제한 개별 혼합하지 않는다.
- 낮 조명이 같은 바다·정원 창밖 풍경 2종. 기본 풍경으로 되돌릴 수 있다.
- 작은 라디오(두 테마 공용), 돌 위 작은 나무(나무 테마용) 2개. 총 체험 수집품 9개. 나무의 테마 제한은 이번 검수 범위를 나타내는 예시 정책이며 물리적인 배치 불가능을 뜻하지 않는다.
- 테마별 물품·풍경을 독립 보존하고 전체 변경을 저장/취소한다. 브라우저 방문 메모리로만 유지하며 새로고침 뒤 영속 저장하지 않는다.

## 정본과 책임

| 정본                                       | 관리하는 것                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `src/lib/workbook-room-catalog.ts`         | 테마별 기본 배경·세트 경로, 풍경 파일, 물품 호환성, 기준 카메라·낮 조명·캐릭터 버전, 실제 사용 자산 목록 |
| `src/lib/workbook-room-slots.ts`           | 물품 ID·이름·자리·기본 배치, 독립 자산의 알파 영역·위치·크기, 행동에 따른 접촉 세트 ID                   |
| `public/images/workbook/room/themes/city/` | 도시 테마 기본 배경과 접촉 세트                                                                          |
| `public/images/workbook/room/views/`       | 풍경 변경 원본                                                                                           |
| `public/images/workbook/room/slots/`       | 기존 공용 물품·새 물품·나무 테마 원본                                                                    |
| 이 문서 및 `contact-sets.md`               | 제작 프롬프트·참조 원화·검수 기록                                                                        |

새 파일 경로를 렌더러에 직접 붙이지 않는다. `furnitureAssets`, `roomObjectResource`, `listRoomResources`를 통해 연결한다. 빈 책상/빈 의자 상태는 테마 기본 배경을 재사용하므로 새 도시 테마의 중복 빈 상태 파일 2개를 저장하지 않는다. 이전 나무 시안의 중복 원본은 제작 이력으로 보존한다.

## 제작 규격

- 기준: 1536×1024, `cutaway-3quarter-v1`, 왼쪽 낮 조명 `warm-daylight-left-v1`, 선글라스·검은 넥타이 캐릭터.
- 캐릭터·의자·도구가 닿으면 세트 제작. 한 테마당 작업 6상태, 독서 4상태를 연결하되 그중 빈 상태 2개는 기본 배경 재사용. 새 테마용 실제 추가 제작은 배경 1 + 접촉 세트 8이다.
- 독립 물품은 투명 RGBA PNG로 제작하고 알파 영역을 측정해 배치값을 등록한다. 그림자 포함 여부와 접지선을 함께 검수한다. 한 물품의 원본을 방과 수집함 썸네일에서 재사용한다.
- 풍경은 창틀·전경 식물을 보존한 같은 카메라의 장면에서 창 영역만 보여준다. 밤·비·계절 조명은 이번 범위가 아니며 창밖만 어둡게 바꾸지 않는다.
- 신규 버전은 기존 파일을 덮어쓰기보다 형제 파일/폴더로 만들고 카탈로그 연결을 전환한다. 원본·참조·프롬프트를 남긴다.

## 추가 순서와 검수

1. ID·자리·호환 테마·공용/세트 여부를 정한다.
2. 기준 방과 캐릭터 시트를 참조해 제작한다. 테마가 다르면 같은 접점의 해당 테마 세트를 제작한다.
3. 파일·배치값·호환성·자산 목록을 등록한다.
4. `pnpm room:check`로 등록 파일 존재·PNG 캔버스·독립 물품 알파 형식·배치 범위를 검사한다. `pnpm check`에서도 같은 검사가 실행된다. 신규 자산의 실제 시점·그림자·가림은 자동 검사로 판정하지 않는다.
5. PC·모바일에서 테마/행동 전환, 물품 교체/보관, 풍경 복원, 저장/취소를 확인한다.

정렬 검증용 PNG 원본은 보존하고 `pnpm room:export`로 서비스용 WebP를 별도 생성한다. 독립 소품은 알파 경계, 접촉 세트와 창 풍경은 고정 영역으로 크롭한다. `src/lib/workbook-room-assets.generated.json`의 원래 캔버스 좌표로 배치와 마스크를 복원한다. 파일명은 원본·크롭·출력 설정의 해시이며 Next에 포함된 Sharp를 사용한다. 새 원본을 추가한 뒤 export와 `pnpm room:check`를 실행한다. 현재 34개 원본(일부 미사용 포함) 63.9MiB가 32개 출력 2.4MiB로 줄었다(96.3%). 이는 전체 리소스 묶음 비교이며 한 화면의 다운로드량은 아니다. 브라우저의 최적화 URL 차단을 피하기 위해 생성된 WebP를 직접 읽는다.

## 생성 프롬프트 — built-in image_gen

검수 기록: PC 1440×1000, 모바일 390×844에서 두 테마의 재질·작업/독서 세트, 창밖 바다/정원, 라디오·작은 나무의 접지와 수집함을 확인했다. 이미지 최적화 경로에서 일부 새 자산이 표시되지 않아 작업실 시안은 직접 경로로 변경하고, E2E에 현재 이미지 전체의 로드 완료 검증을 추가했다. PC·모바일 4개 여정 테스트 통과. 자체 코드 검토에서 테마별 상태의 불변 갱신과 저장/취소, 호환성 제한, 기본 배경 별칭 재사용을 확인했다. 그림의 세부 질감·풍경 경계는 자동 검사 대상이 아니며 새로운 테마를 추가할 때마다 시각 검수를 반복한다.

### 테마·풍경 공통

```text
Use case: precise-object-edit. Edit reference room preserving EXACT 1536x1024 full canvas, elevated camera, every furniture position and size, window frame geometry and grid, existing plants, rugs, desk/chairs and perspective. No crop or zoom, no character, no text.
```

#### city-base

```text
Change interior surfaces/materials to a tasteful calm creative CITY STUDIO theme: cream plaster walls become soft warm light gray plaster, floor becomes medium dark smoked oak (same floorboards), desk/chair/shelves become darker walnut with subtle charcoal metal accents but IDENTICAL shapes/positions. Cream lounge upholstery becomes muted sage fabric. Rug becomes understated oatmeal flatwoven rug with subtle charcoal lines, same outline. Preserve plants and books. Window outside becomes distant contemporary city rooftops under clear pale blue daytime sky, same warm late afternoon sunlight direction. Adult quiet refined workspace, not futuristic. Keep desk top/wall blank. NO extra decor.
```

#### view-coast

```text
Change ONLY scenery visible through window panes to a calm turquoise coast, distant headland, pale blue sky in warm daytime light. Preserve all wooden window frames/grids, curtains, foreground plants/books and all interior geometry pixel aligned. No beach objects inside. No people.
```

#### view-garden

```text
Change ONLY scenery visible through window panes to a quiet green garden with soft distant mountains and blue daytime sky, slightly different broadleaf shapes and airy open depth instead of golden autumn trees. Preserve all wooden window frames/grids, curtains, foreground plants/books and all interior geometry pixel aligned. No people.
```

### 도시 접촉 세트 공통

참조 1: 도시 기본 방. 참조 2: 같은 ID의 기존 나무 테마 접촉 세트.

```text
Use case: compositing. Reference1 is TARGET city room, preserve its exact full 1536x1024 frame, camera and every furniture position, walnut material, sage upholstery, gray walls, oatmeal rug, daylight and window view. Reference2 is ONLY reference for the requested local character/tool/cushion state. Transfer requested state into reference1 at EXACT corresponding furniture location, physically integrated, NOT transferring reference2's light wood/cream chair/orange rug/wall materials. Keep target furniture, lighting and surfaces. No crop/zoom/text/UI. Capybara if present must retain round black sunglasses, black necktie, brown pear-shaped body. Hands/body correctly supported by desk/chair, desk edge occlusion correct. Laptop/notebook entirely WITHIN desktop edges. Right desktop EMPTY no cup. Edit ONLY stated region, preserve everything else.
```

#### desk-work-laptop

```text
Desk region only. Capybara seated correctly in target desk chair, Open laptop and natural typing paws if character present, exactly like reference2.
```

#### desk-work-notebook

```text
Desk region only. Capybara seated correctly in target desk chair, Open notebook and pen, natural writing paws if character present, like reference2.
```

#### desk-work-empty

```text
Desk region only. Capybara seated correctly in target desk chair, Desk completely empty, capybara paws on lap.
```

#### desk-idle-laptop

```text
Desk region only. EMPTY target desk chair, NO capybara anywhere. Open laptop and natural typing paws if character present, exactly like reference2.
```

#### desk-idle-notebook

```text
Desk region only. EMPTY target desk chair, NO capybara anywhere. Open notebook and pen, natural writing paws if character present, like reference2.
```

#### lounge-read-cushion

```text
Lounge chair region only. Capybara seated naturally IN sage armchair reading open green book, as reference2; sage armrests occlude body properly. Orange small throw cushion tucked against backrest, behind character if present.
```

#### lounge-read-plain

```text
Lounge chair region only. Capybara seated naturally IN sage armchair reading open green book, as reference2; sage armrests occlude body properly. No orange cushion, plain sage upholstery.
```

#### lounge-idle-cushion

```text
Lounge chair region only. No capybara anywhere, EMPTY lounge chair. Orange small throw cushion tucked against backrest, behind character if present.
```

### 독립 소품 공통

```text
Use case: stylized-concept. Single collectible object for warm illustrated elevated-threequarter cutaway room reference. TRANSPARENT PNG, no room/background, no black backdrop, no halo/glow, soft localized contact shadow only. Warm daylight from upper left, dimensional tasteful painterly materials, no text/logos. Center object with generous transparent margin, landscape canvas.
```

#### radio

```text
Small retro tabletop radio, charcoal casing, warm walnut front and cream circular tuning knob, tiny orange indicator, short antenna. Camera looks down onto top slightly, front faces viewer-left, sits naturally on right part of wood desktop. Compact horizontal proportions.
```

#### bonsai

```text
Small artful miniature ficus tree with rounded green leaf clusters growing around a natural gray stone, shallow matte ivory ceramic bowl, soil visible. Elevated threequarter camera, understated sculptural adult interior collectible, visible base contact shadow, not cute toy. Place on floor.
```
