import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// 로컬 Supabase에 붙어 DB 함수·접근 규칙을 사람별로 검사한다. `pnpm test:db`.
// 실행 전 `supabase start`가 필요하다. 기본 `pnpm test`(jsdom)와 분리한다.
// Node 22의 내장 .env 로더로 로컬 Supabase 연결 정보를 읽는다(새 의존성 없이).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["supabase/tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
