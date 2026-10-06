# 워크북 도입 에셋

## 손 개수 오류 수정

사용자 지적으로 중앙 메모 장면의 손이 세 개인 오류를 확인했다. 내장 imagegen으로 턱 아래의 추가 손만 제거한 `public/images/workbook/journey/intro-story-v2.png`를 생성하고 CSS 참조를 교체했다. 수정본에서 종이를 잡은 손과 책상 위 손, 총 두 손을 시각 확인했다. 이전 v1은 비교용으로 보존한다.

프롬프트: Precise anatomical correction to existing three-panel pixel-art triptych. ONLY edit CENTER PANEL: capybara currently has THREE hands (one gripping paper at lower left, one under chin, one resting on desk at right). REMOVE ONLY the extra hand under its chin completely and replace that area with continuous black hoodie chest/neck fabric. Final center character has EXACTLY TWO arms and TWO hands: one hand holds paper at lower left, other hand rests on desk at right. No chin-support hand, no extra paw, no floating hand. Preserve head, sunglasses, face, paper-holding hand, desk-resting hand, laptop, all furniture, colors, lighting, pixel texture. Keep LEFT and RIGHT PANELS unchanged. Keep exact three equally sized square panels in one horizontal row, total 3:1 canvas. No added text or borders. Minimal local repair, do not redesign.

2026-10-05. 내장 imagegen 사용. 배낭 끈 캐릭터를 정체성 참조, study-v3 작업실을 조명·환경 참조로 사용했다. 생성물을 프로젝트에 복사하고 실제 클래스에 연결했다.

- `public/images/workbook/journey/capy-backpack-walk-v4.png`: 2172×724, 네 칸 보행. CSS 배경 위치로 재생한다. 두 주요 다리 자세가 반복되는 짧은 루프다.
- `public/images/workbook/journey/intro-story-v1.png`: 2172×724, 세 정사각형 장면. CSS 배경으로 각 장면만 표시한다. 대사는 이미지 밖의 코드다.

## 보행 프롬프트

Production pixel character WALK-IN-PLACE sprite sheet using this exact capybara identity. Exactly FOUR frames in ONE horizontal row, equally sized cells, identical body/head size, fixed centered anchor and foot baseline per cell. Full body each cell, ample margin. Bipedal capybara black hoodie sunglasses beige backpack, BOTH paws grip their respective shoulder straps at chest height in ALL frames. Only stubby legs alternate: frame1 left foot forward right foot back, frame2 feet passing, frame3 right foot forward left foot back, frame4 opposite passing. Clear distinct leg poses; arms do not swing. Same broad flat muzzle and reduced SD head. Faces right three-quarter throughout. Crisp warm pixel art. Transparent alpha background no floor/shadow/no labels/no borders. Wide 4:1 canvas. Characters aligned at centers 12.5%,37.5%,62.5%,87.5% across.

## 이야기 프롬프트

Create a cinematic pixel-art story triptych for an adult cozy web game. Use reference1 for capybara character identity (broad flat muzzle, sunglasses, black hoodie, short limbs, beige backpack), reference2 for warm walnut study environment and lighting. EXACTLY THREE equally sized square panels arranged side by side in ONE horizontal row, edge-to-edge with no borders, 3:1 canvas. Consistent premium detailed warm pixel art like a narrative simulation game, no photoreal fur. Panel1 LEFT: medium shot capybara at desk holding smartphone to ear, listening to a friend, notebook, teacup and laptop, warm sunset window. Panel2 CENTER: same character and room from slightly wider angle, phone set down, looking through several paper notes while laptop shows small separate thumbnails of a teacup, stones and a breathing circle (no text), slightly puzzled, scattered notes. Panel3 RIGHT: capybara standing at open workshop door at sunset, beige backpack on both shoulders BOTH paws gripping shoulder straps, looking toward village outdoors ready to depart, short bipedal legs. Three clear distinct story actions. Maintain same head proportions, sunglasses, hoodie and color grade across panels. Composition each subject in central region of its own panel with full face visible, spare lower foreground for external UI dialogue (do not draw dialogue). No speech bubbles, no text, no labels, no lettering, no UI, no comic gutters. All three panels same height and exactly one-third of width.
