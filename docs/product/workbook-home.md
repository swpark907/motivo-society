# 워크북 홈 기획 · 시안 01

향후 콘텐츠 기획은 [워크북 방향·논의 기록](workbook-direction.md)을 참조한다. 이 문서는 현재 홈 레이아웃과 제작 이력을 설명한다.

## 목적

직접 조작하고 반응을 느끼며 재미있게 익히는 인터랙티브 콘텐츠 공간. 투두나 해빗 트래커가 중심이 아니며, 체크·진행률은 보조 수단이다. 오디스트 웍스의 카피바라 쓰다듬기·돌 쌓기, 차 따르기, 마우스로 유도하는 깊은 호흡처럼 행동 자체가 경험이 된다.

현재 미션·체크리스트는 첫 화면 구성 시안이다. 콘텐츠는 이 철학에 맞춰 후속 기획에서 재구성한다. 현재 구현 범위는 아래의 정적 레이아웃 절을 따른다.

## 디자인 방향

사용자가 기존 카피바라 레퍼런스의 구성과 분위기를 거의 그대로 가져가기로 했다. 공통 GNB는 유지하고 그 아래에 워크북 메뉴, 캐릭터 히어로, 미션과 카테고리, 우측 학습 도구를 배치한다. 워크북 안에서만 14px 라운드 카드, 따뜻한 오렌지와 차콜 표면을 사용한다. 모바일에서는 메뉴를 가로로, 본문과 도구를 한 열로 배치한다.

## 첫 콘텐츠 제안

첫 번째 여정은 ‘AI와 함께 나에게 필요한 작은 웹 프로젝트 하나’. 강의 수강보다 작은 결과물을 남기는 활동에 초점을 둔다. 예상 시간은 기획상 가이드이며 사용자 검증 전이다.

| 미션                 | 활동                                | 남길 것                    | 예상 시간 |
| -------------------- | ----------------------------------- | -------------------------- | --------- |
| 지금의 나를 살펴보기 | 반복하는 일과 바꾸고 싶은 이유 찾기 | 바꿔 보고 싶은 일 한 문장  | 10분      |
| 작은 아이디어 정하기 | 사용할 사람·상황·기능 정하기        | 사용자와 핵심 기능 한 가지 | 15분      |
| 첫 화면 만들어 보기  | AI와 화면을 만들고 직접 눌러보기    | 첫 화면과 확인할 점        | 30분      |
| 배운 것 남기기       | 잘된 점·막힌 점·다음 시도 돌아보기  | 세 줄 회고                 | 10분      |

카테고리는 시안용 제안이며 확정된 콘텐츠 분류 체계가 아니다. Self(자기 이해), Work(업무), Skill(만들기), Life(습관), Creative(창작) 다섯 가지로 탐색하게 한다. 카테고리 선택 인터랙션은 정적 레이아웃으로 정리하며 제거했다.

## 현재 구현 범위 — 정적 레이아웃

사용자 요청으로 클릭 인터랙션을 제거하고 서버 컴포넌트 기반 홈 레이아웃만 적용한다. 히어로·미션 4개·카테고리 5개·예시 달력·체크리스트의 배치와 반응형을 확인하는 단계다.

- 미션·카테고리는 일반 콘텐츠 카드이며 버튼이나 선택 상태가 없다.
- 달력은 2026년 9월의 고정 예시이며 월 탐색은 없다.
- 체크리스트는 정적인 예시 목록이며 입력·체크·추가 기능은 없다.
- 페이지 이동과 섹션 앵커 링크는 유지한다.
- 콘텐츠는 기존 기획 초안이며 인터랙션 중심 철학에 맞춘 후속 기획이 필요하다.

## 후속 결정

회원·저장 방식, 커리큘럼 상세 구조, 미션 응답 저장, 실제 학습일과 진행률 계산, 발행·검증 과정은 별도 설계한다. 레벨·스트릭·커뮤니티·음악 플레이어는 이번 범위에서 제외한다. 발행된 학습 자료로 오인하지 않도록 콘텐츠 구상/미리보기를 표시한다.

## 이미지

내장 image_gen으로 생성한 `public/images/workbook/study.png`를 히어로 및 미션의 서로 다른 구도로 사용했다. 개별 카드 전용 이미지는 다음 시안에서 제작할 수 있다.

생성 프롬프트: Create a wide cinematic website hero background, 1536x864 landscape. Photographic textured illustration of a capybara in a dark charcoal hoodie and sunglasses, sitting at a wooden desk with a laptop and ceramic mug. Cozy creative study overlooking mountains at sunset, amber desk lamp, plants, soft film texture, refined warm earthy colors, realistic fur. Capybara occupies right half, left 45% is dark quiet wall and desk with abundant negative space for HTML text overlay. No text, letters, UI, logos, borders, gradients added as graphic effects. Mood: a friendly companion learning and making things together.

### 히어로 2차 수정

내장 image_gen으로 원본 목업과 1차 이미지를 함께 참조해 `public/images/workbook/study-v2.png`를 생성했다. 히어로만 교체하며 미션 카드 이미지는 유지한다.

프롬프트: Wide 2.7:1 cinematic photographic hero. Match the original mockup’s cute, subtly flattened broad capybara face, short rounded muzzle, compact proportions, black hoodie and sunglasses. Look toward the developer laptop, holding a white tea mug. Medium wide desk composition with stacked books on both sides, amber desk lamp, notebooks, pencils, pens, brushes and a glowing spherical moon sculpture. Warm mountain-lake sunset, realistic soft fur, quiet dark space on the left for HTML copy. No UI, readable text or watermark.

### 히어로 크롭과 레일 잔광 보완

달 조명은 2차 이미지 자체에서도 오른쪽 끝이 잘려 있었다. 내장 image_gen으로 조명 구체와 받침이 전부 보이도록 `public/images/workbook/study-v3.png`를 생성하고, 데스크톱에서는 오른쪽 기준으로 크롭한다. 좁은 모바일에서는 캐릭터 중심 구도를 유지하므로 양끝 소품이 모두 보이지는 않는다.

편집 프롬프트: Preserve the approved capybara identity, flattened face, sunglasses, hoodie, tea mug, laptop, lighting and props. Reframe or extend the right desk so the whole moon globe and base are visible with breathing room to the right. Keep the wide 2.7:1 composition and left text space. No UI or typography.

원본 레일 하단은 초점이 흐려진 불규칙한 주황·크림색 빛 덩어리로 보인다. 래스터 목업만으로 원래 구현 방법은 판별할 수 없다. 코드에서는 서로 다른 타원형 radial-gradient 5개에 blur를 적용해 정적인 촛불 잔광을 재현한다. 데스크톱 레일 내부에만 표시하며 글자 아래 공간을 확보하고 포인터 입력을 가로채지 않는다.
