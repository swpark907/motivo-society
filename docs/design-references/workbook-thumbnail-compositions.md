# 워크북 썸네일 구도 템플릿

클래스 내용과 내부 경험을 먼저 전달한다. 카피바라와 사진 같은 질감을 공통으로 사용하되 모든 카드의 시점·캐릭터 크기를 반복하지 않는다. 계절·색·소품은 클래스 주제에 맞춰 정한다.

## A · 동료와 제작 화면

기존 시안의 기본 구도다. 카피바라의 얼굴/표정과 제작 화면을 옆 또는 사선에서 함께 본다. 친근한 동료의 존재와 작업실 분위기를 보여줄 때 사용한다. 인접한 모든 카드를 이 구도로 채우지 않는다.

## B · 어깨 너머 제작 화면

2026-10-16 사용자 요청으로 추가한 대안이다. 카메라는 카피바라 뒤에서 살짝 높은 위치에 둔다. 카피바라는 왼쪽 아래 전경에 머리 뒤·귀·어깨가 보이는 작은 동료로 두고, 화면을 주인공으로 삼는다.

- 카피바라: 전체 면적의 약 20~25%를 목표로 한다. 얼굴 일부와 귀로 종을 알아볼 수 있게 하며 화면을 가리지 않는다.
- 모니터: 전체 면적의 약 40~50%를 목표로 한다. 중앙 또는 중앙 오른쪽에서 비스듬함을 줄여 작업 내용을 알아보기 쉽게 보여준다.
- 제작 단서: 키보드·손과 클래스에 맞는 스케치/스토리보드를 필요한 만큼만 둔다.
- 배경: 계절·작업실의 분위기를 유지하되 화면의 정보와 경쟁하지 않는다.
- 비율: 기존 카드와 같은 가로 16:9. 배지와 제목은 이미지에 합성하지 않고 HTML로 제공한다.

면적 수치는 생성 방향이며 기계적 픽셀 판정을 뜻하지 않는다. 작은 카드에서도 캐릭터를 알아보고 어떤 작업을 하는지 읽을 수 있는지 확인한다.

### 재사용 프롬프트

```text
Asset: photorealistic cinematic class thumbnail, landscape 16:9.
Class topic: [클래스 주제].
Scene: [계절/작업실/빛/팔레트].
Composition: wider slightly elevated over-the-shoulder view from BEHIND a lifelike capybara. Back of head, one ear, a little cheek and shoulder form a small foreground shape in lower left, roughly 20–25% of frame. The monitor is the hero, almost face-on, unobstructed, about 40–50% of frame in center/right. A viewer looks past a companion's shoulder at the work.
Screen: [해당 클래스의 실제 주제를 보여주는 제작 화면].
Desk: [관련 스케치/스토리보드/테스트 기기].
Preserve: photographic fur, coherent perspective, tactile materials, breathing room, class-specific visual identity.
Avoid: dominant front portrait, head blocking monitor, generic website for every subject, floating UI, excessive props, text overlays, logos, watermark, cartoon/3D-render appearance.
```

### 게임 클래스 비교 시안

`public/images/workbook/candidates/class-game-shoulder-v1.png` — 기존 바닷가 게임 이미지를 참조해 B구도를 만든 비교용 후보. 사용자 승인으로 홈 캐러셀과 전체 클래스 목록의 게임 카드에 적용했다. [생성 프롬프트와 검수 기록](workbook-class-thumbnails-20261016.md).
