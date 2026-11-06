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
