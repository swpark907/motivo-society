# 비밀 정원 컬러링 데모

2026-10-02. 사용자가 승인한 순서: 풍경 시안 생성 → 컬러링 선화 변환 → 원클릭 웹 데모.
내장 ImageGen으로 생성·편집했다. 운영 워크북 메뉴에는 연결하지 않은 독립 실험이다.

## 생성 프롬프트

Use case: illustration-story. Asset type: detailed landscape concept for an adult digital coloring book. Create a spectacular, beautiful intricate botanical garden landscape: terraced flower gardens surrounding an ornate glass conservatory, winding stone paths and a stream with a small arched bridge, layered flowering trees, distant mountains. Rich jewel-toned flowers, luminous warm sunlight, elegant hand-illustrated storybook engraving with clean outlined forms and flat contained colors. Landscape composition, immersive full scene, hundreds of distinct botanical and architectural details with clear silhouettes, varied large and small shapes. Designed to later become closed-region coloring line art. No people, no words, no watermark, no UI. Avoid photorealism, fuzzy painterly boundaries and excessive tiny hatching.

## 선화 편집 프롬프트

Use case: style-transfer. Edit target: the just-generated ornate botanical garden landscape. Convert this SAME composition into a production-quality intricate adult coloring-book line drawing. Preserve conservatory, bridge, stream, mountains, foreground flowers and framing trees exactly in their positions and scale. Pure white paper and crisp solid black contour lines only. Remove ALL color, gray, shadows, texture, hatching, stippling and filled black masses. Each petal, leaf, window pane, stone and landscape section should be an enclosed white region with a fully closed black boundary. Keep high detail, hundreds to thousands of coloring cells, but keep contours clean and separated; tiny objects may be simplified enough to tap when zoomed. Consistent thin black outlines, no gaps, no text, no border. Landscape full frame matching reference dimensions.

## 데모 구조와 한계

- 실제 에셋: `public/coloring-book/garden-color-v1.png`, `garden-lines-v1.png`.
- 로딩 시 선화의 RGB 채널이 모두 200 이상인 픽셀을 4방향 연결 영역으로 분석한다. 16픽셀 미만의 영역은 제외한다. 칸 번호는 선화 버전마다 달라질 수 있어 저장 키도 버전별로 분리한다.
- 클릭한 칸에만 색을 적용하고 선화를 유지한다. 1–6배 확대, 스크롤·이동 모드, 최근 100회 되돌리기, 브라우저 자동 저장, PNG 저장, 원본 시안 비교를 제공한다.
- 서버·로그인·AI 호출은 색칠 과정에 필요 없다. 다른 기기와 진행 상태를 동기화하지 않는다.
- 생성된 선화는 원본의 모든 세부를 정확히 보존하지 않는다. 끊어진 선으로 칸이 합쳐지거나 작은 칸이 제외될 수 있다. 모든 칸의 수동 검수와 2–3일 몰입 시간 검증은 아직 하지 않았다.
- 첫 로딩의 영역 분석은 브라우저 메인 스레드에서 수행한다. 실제 저성능 기기에서 느리면 미리 계산한 영역 지도나 Worker로 옮긴다.

커밋은 사용자 완성 판단 후 진행한다.

## 확인 결과

- 현재 선화에서 색칠 가능한 연결 영역 7,356개를 인식했다. 사람이 의도한 사물 개수와는 다르다.
- `pnpm check` 통과, 전체 Playwright E2E 16개 통과(데스크톱·모바일). 실제 칸 클릭, 되돌리기, 새로고침 후 저장 복원, 확대·전체 보기, 원본 전환과 PNG 다운로드를 확인했다.
- 사용자 승인 후 Chrome 1440×1000 및 393×852 화면을 직접 검토했다. 가로 넘침 없음. 모바일의 세부 색칠은 확대가 필요하다. 화면 검토용 스크린샷은 임시 파일로만 보관했다.
- 자체 코드 리뷰에서 추가 correctness 문제를 발견하지 않았다. 모든 칸의 경계 정확도와 저성능 기기 성능은 검증 범위 밖이다.
