import { expect, type APIRequestContext, type Page } from "@playwright/test";

// 플랫폼 e2e 공용: 로컬 Supabase의 메일은 Mailpit에 도착한다.
export const MAILPIT = "http://127.0.0.1:55424";

export async function magicLinkFor(request: APIRequestContext, email: string): Promise<string> {
  let link = "";
  await expect
    .poll(
      async () => {
        const res = await request.get(`${MAILPIT}/api/v1/search`, {
          params: { query: `to:"${email}"`, limit: "1" },
        });
        const body = (await res.json()) as { messages: { ID: string }[] };
        const id = body.messages[0]?.ID;
        if (!id) return "";
        const message = (await (await request.get(`${MAILPIT}/api/v1/message/${id}`)).json()) as {
          Text: string;
        };
        link = message.Text.match(/https?:\/\/\S+\/auth\/v1\/verify\S+/)?.[0] ?? "";
        return link;
      },
      { timeout: 15_000 },
    )
    .not.toBe("");
  return link.replace(/[)\]>]+$/, "");
}

/** 겹치지 않는 시험용 이메일. */
export function testEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.test`;
}

/** 12자 이하의 겹치지 않는 닉네임. */
export function testNickname(): string {
  return `t${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

/** 새 이메일로 가입해 메일 링크를 연다(온보딩 직전까지). */
export async function signUpByMail(
  page: Page,
  request: APIRequestContext,
  email: string,
  path = "/me",
) {
  await page.goto(path);
  await page.getByLabel("이메일").fill(email);
  await page.getByRole("button", { name: "로그인 링크 받기" }).click();
  await expect(page.getByRole("heading", { name: "메일을 보냈어요" })).toBeVisible();
  await page.goto(await magicLinkFor(request, email));
}

/** 시험장 가짜 사람으로 로그인(개발 환경 전용 로그인 영역). */
export async function signInAs(page: Page, nickname: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  // 화면이 다 준비되기 전에 누르면 개발 서버에서 클릭이 가끔 사라진다.
  await page.waitForLoadState("networkidle");
  await page.getByText("개발용 · 시험장 사람으로 들어가기").click();
  await page.getByRole("button", { name: new RegExp(nickname) }).click();
  // 로그인 액션(수 초) 뒤 이동할 화면을 개발 서버가 처음 컴파일하면 더 걸린다.
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[?]/g, "\\?")}$`), { timeout: 30_000 });
}

/** 시험 데이터를 처음 상태로(로컬 Supabase 서비스 키, 개발 전용). */
export async function reseedSandbox(request: APIRequestContext) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // 이미 환경 변수가 있으면 그대로 쓴다.
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await request.post(`${url}/rest/v1/rpc/sandbox_reseed`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    data: {},
  });
  expect(res.ok()).toBe(true);
}

/** 시험 준비용으로 행 하나를 직접 넣는다(로컬 Supabase 서비스 키, 개발 전용). */
export async function sandboxInsert(
  request: APIRequestContext,
  table: string,
  row: Record<string, unknown>,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const res = await request.post(`${url}/rest/v1/${table}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    data: row,
  });
  expect(res.ok(), await res.text()).toBe(true);
}
