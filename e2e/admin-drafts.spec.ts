import { expect, test, type Page } from "@playwright/test";
async function action(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  if (!(await button.isVisible()))
    await page.getByRole("button", { name: "편집 도구 더보기", exact: true }).click();
  await button.click();
}
async function add(page: Page, slug: string, title: string) {
  await action(page, "새 글");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("글 주소", { exact: false }).fill(slug);
  await dialog.getByLabel("글 제목 · 목록과 공유에 표시").fill(title);
  await dialog.getByRole("button", { name: "글 열기", exact: true }).click();
}
async function persisted(page: Page) {
  return page.evaluate(async () => {
    if (!(await indexedDB.databases()).some((db) => db.name === "motivo-editorial-drafts"))
      return undefined;
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("motivo-editorial-drafts", 1);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      return await new Promise<
        { sessions: { document: { slug: string; related: { slug: string }[] } }[] } | undefined
      >((resolve) => {
        const request = db.transaction("drafts").objectStore("drafts").get("workspace-v1");
        request.onsuccess = () => resolve(request.result?.data);
      });
    } finally {
      db.close();
    }
  });
}
test("임시 저장 목록에서 검색하고 이어 쓰며 삭제 확인·취소·재방문을 처리한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  await add(page, "draft-alpha", "목록 테스트 첫 글");
  await add(page, "draft-beta", "목록 테스트 둘째 글");
  await action(page, "임시 저장 목록");
  let dialog = page.getByRole("dialog", { name: "임시 저장 목록" });
  await dialog.getByLabel("글 찾기").fill("첫 글");
  const cover = dialog.locator("li img");
  await expect(cover).toHaveCount(1);
  await expect
    .poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await expect(dialog.locator("li")).toHaveCount(1);
  await dialog.getByRole("button", { name: /목록 테스트 첫 글 draft-alpha/ }).click();
  await expect(page.frameLocator('iframe[title="아티클 미리보기"]').locator("h1")).toHaveText(
    "목록 테스트 첫 글",
  );
  await action(page, "임시 저장 목록");
  await dialog.getByRole("button", { name: "목록 테스트 첫 글 초안 삭제", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "초안 삭제 확인" });
  await confirmation.getByRole("button", { name: "취소", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "목록 테스트 첫 글 초안 삭제", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "목록 테스트 첫 글 초안 삭제", exact: true }).click();
  await confirmation.getByRole("button", { name: "초안 삭제", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "목록 테스트 첫 글 초안 삭제", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(async () =>
      (await persisted(page))?.sessions.some((entry) => entry.document.slug === "draft-alpha"),
    )
    .toBe(false);
  await page.reload();
  await action(page, "임시 저장 목록");
  dialog = page.getByRole("dialog", { name: "임시 저장 목록" });
  await expect(
    dialog.getByRole("button", { name: "목록 테스트 첫 글 초안 삭제", exact: true }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "목록 테스트 둘째 글 초안 삭제", exact: true }),
  ).toBeVisible();
});
test("마지막 초안까지 지우면 빈 목록을 복원하고 새 글을 다시 시작한다", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/demo/admin/articles");
  await action(page, "임시 저장 목록");
  const dialog = page.getByRole("dialog", { name: "임시 저장 목록" });
  const count = await dialog.locator("li").count();
  for (let i = 0; i < count; i++) {
    await dialog
      .getByRole("button", { name: /초안 삭제$/ })
      .first()
      .click();
    await page
      .getByRole("dialog", { name: "초안 삭제 확인" })
      .getByRole("button", { name: "초안 삭제", exact: true })
      .click();
  }
  await expect(dialog.getByText("임시 저장한 글이 없어요. 새 글을 작성해보세요.")).toBeVisible();
  await expect.poll(async () => (await persisted(page))?.sessions.length).toBe(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "아직 저장한 글이 없어요." })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "JSON 내보내기 ↗", exact: true, includeHidden: true }),
  ).toBeDisabled();
  await add(page, "restart-draft", "다시 쓰는 글");
  await expect(page.frameLocator('iframe[title="아티클 미리보기"]').locator("h1")).toHaveText(
    "다시 쓰는 글",
  );
});

test("현재 글 삭제 후 다른 글의 미적용 JSON도 이어 편집한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  await action(page, "원문 편집");
  await page.getByLabel("에디토리얼 JSON").fill("{unfinished-draft");
  await add(page, "throwaway-draft", "삭제할 초안");
  await action(page, "임시 저장 목록");
  await page
    .getByRole("dialog", { name: "임시 저장 목록" })
    .getByRole("button", { name: "삭제할 초안 초안 삭제", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "초안 삭제 확인" })
    .getByRole("button", { name: "초안 삭제", exact: true })
    .click();
  await page.getByRole("button", { name: "임시 저장 목록 닫기", exact: true }).click();
  await expect(page.getByLabel("에디토리얼 JSON")).toHaveValue("{unfinished-draft");
  await expect
    .poll(async () =>
      (await persisted(page))?.sessions.some((entry) => entry.document.slug === "throwaway-draft"),
    )
    .toBe(false);
  await page.reload();
  await expect(page.getByLabel("에디토리얼 JSON")).toHaveValue("{unfinished-draft");
});
