import { defineConfig, devices } from "@playwright/test";

// 사용자 여정 테스트. 스타일은 테스트하지 않는다 (AGENTS.md 작업 규약).
const PORT = 3211;
// 같은 폴더에서 `next dev`가 이미 떠 있으면 Next가 두 번째 서버를 막는다.
// 그럴 때는 PW_BASE_URL=http://localhost:3000 처럼 떠 있는 서버를 쓴다(웹서버를 새로 띄우지 않음).
const externalBaseURL = process.env.PW_BASE_URL;

// macOS 13에는 Playwright 번들 Chromium이 없어 설치된 Google Chrome을 쓴다. 그 외(CI·Linux)는 번들 Chromium.
// 바꾸려면 PW_CHANNEL=chromium|chrome|msedge.
const channel = process.env.PW_CHANNEL ?? (process.platform === "darwin" ? "chrome" : undefined);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // 개발 서버(next dev)는 화면을 처음 열 때 컴파일하고, 서버 쪽 이동(redirect)도 느릴 때가 있다.
  // 기본 5초로는 플랫폼 여정이 늘어난 뒤 이동 대기가 가끔 넘친다.
  expect: { timeout: 10_000 },
  // 코드가 바뀐 직후에는 화면 하나를 처음 그리는 데만 10초 가까이 걸린다(로그인 → 이동이 겹치면 30초를 넘는다).
  timeout: 60_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: externalBaseURL ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: `pnpm dev -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel } },
  ],
});
