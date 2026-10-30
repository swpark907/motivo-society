import fs from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
async function action(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  if (!(await button.isVisible()))
    await page.getByRole("button", { name: "편집 도구 더보기", exact: true }).click();
  await button.click();
}
async function saved(page: Page) {
  return page.evaluate(async () => {
    if (!(await indexedDB.databases()).some((db) => db.name === "motivo-editorial-drafts"))
      return undefined;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("motivo-editorial-drafts", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<unknown>((resolve, reject) => {
        const request = db
          .transaction("drafts", "readonly")
          .objectStore("drafts")
          .get("workspace-v1");
        request.onsuccess = () => resolve(request.result?.data);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}
async function waitSavedText(page: Page, text: string) {
  await expect.poll(async () => JSON.stringify(await saved(page))).toContain(text);
}

test("새 글·미적용 문구·미사용 사진을 새로고침과 재진입 뒤 복원한다", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/demo/admin/articles");
  await action(page, "새 글");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("글 주소", { exact: false }).fill("autosave-note");
  await dialog.getByLabel("글 제목 · 목록과 공유에 표시").fill("자동 저장할 글");
  await dialog.getByRole("button", { name: "글 열기", exact: true }).click();
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.locator("h1").click();
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
  await frame.getByRole("button", { name: "사진 바꾸기", exact: true }).click();
  await frame.getByLabel("내 컴퓨터에서 사진 추가", { exact: true }).setInputFiles({
    name: "saved-photo.png",
    mimeType: "image/png",
    buffer: await fs.readFile("public/images/workbook/notes/show-the-screen-v1.png"),
  });
  await expect(
    frame.getByRole("button", { name: "사진 선택: saved-photo.png", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await frame.getByRole("button", { name: "취소", exact: true }).click();
  await frame.getByRole("button", { name: "편집 닫기 ×", exact: true }).click();
  await frame.locator("#intro").click();
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("선택한 구간의 문구").fill("새로고침 뒤에도 남길 미적용 문단");
  await waitSavedText(page, "새로고침 뒤에도 남길 미적용 문단");
  await waitSavedText(page, "saved-photo.png");
  await page.reload();
  await expect(page.getByLabel("샘플 글", { exact: true })).toHaveValue("autosave-note");
  await expect(frame.getByLabel("선택한 구간의 문구")).toHaveValue(
    "새로고침 뒤에도 남길 미적용 문단",
  );
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await frame.getByRole("button", { name: "편집 닫기 ×", exact: true }).click();
  await frame.locator("h1").click();
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
  await frame.getByRole("button", { name: "사진 바꾸기", exact: true }).click();
  await frame.getByRole("button", { name: "사진 선택: saved-photo.png", exact: true }).click();
  await frame.getByRole("button", { name: "사진 적용", exact: true }).click();
  await expect
    .poll(async () => {
      const data = (await saved(page)) as {
        sessions: { document: { slug: string; thumbnail: string } }[];
      };
      return data.sessions.find((entry) => entry.document.slug === "autosave-note")?.document
        .thumbnail;
    })
    .toMatch(/^data:image\/jpeg;base64,/);
  await page.goto("/demo/admin");
  await page.goto("/demo/admin/articles");
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute(
    "src",
    /^data:image\/jpeg;base64,/,
  );
  await expect(frame.locator("#intro")).toHaveText("새로고침 뒤에도 남길 미적용 문단");
});

test("기본정보 작성 중 입력과 잘못된 JSON 원문도 그대로 복원한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  await action(page, "새 글");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("글 제목 · 목록과 공유에 표시").fill("아직 작성 중인 제목");
  await waitSavedText(page, "아직 작성 중인 제목");
  await page.reload();
  await expect(dialog.getByLabel("글 제목 · 목록과 공유에 표시")).toHaveValue(
    "아직 작성 중인 제목",
  );
  await dialog.getByRole("button", { name: "취소", exact: true }).click();
  await action(page, "원문 편집");
  await page.getByLabel("에디토리얼 JSON", { exact: true }).fill('{"미완성 원문":');
  await waitSavedText(page, "미완성 원문");
  await page.reload();
  await expect(page.getByLabel("에디토리얼 JSON", { exact: true })).toHaveValue('{"미완성 원문":');
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await expect(frame.locator("h1")).toContainText("원하는 결과");
});

test("빈 비교 항목 초안을 유효한 문서로 강제 변경하지 않고 복원한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.locator("#block-3").click();
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("항목 1 제목", { exact: true }).fill("");
  await expect
    .poll(async () => {
      const data = (await saved(page)) as {
        canvas?: { contentEdit?: { block: { items: { label: string }[] } } };
      };
      return data.canvas?.contentEdit?.block.items[0].label;
    })
    .toBe("");
  await page.reload();
  await expect(frame.getByLabel("항목 1 제목", { exact: true })).toHaveValue("");
  await expect(frame.getByRole("button", { name: "내용 적용", exact: true })).toBeDisabled();
});

test("브라우저 저장 실패를 표시하고 메모리의 글은 계속 편집할 수 있다", async ({ page }) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.goto("/demo/admin/articles");
  await expect(page.getByRole("status", { name: "자동 임시 저장 상태" })).toContainText(
    "저장에 실패",
  );
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.locator("h1").click();
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("선택한 구간의 문구").fill("저장 실패 후에도 편집하는 제목");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(frame.locator("h1")).toHaveText("저장 실패 후에도 편집하는 제목");
  const download = page.waitForEvent("download");
  await action(page, "JSON 내보내기 ↗");
  expect((await download).suggestedFilename()).toContain("describe-the-result");
});

test("다른 탭의 최신 임시 저장본을 자동으로 덮어쓰지 않는다", async ({ page, context }) => {
  await page.goto("/demo/admin/articles");
  await expect
    .poll(async () => {
      const data = (await saved(page)) as { canvas: unknown };
      return Boolean(data?.canvas);
    })
    .toBe(true);
  await expect(page.getByRole("status", { name: "자동 임시 저장 상태" })).toContainText(
    "임시 저장됨",
  );
  const other = await context.newPage();
  await other.goto("/demo/admin/articles");
  await expect(other.getByRole("status", { name: "자동 임시 저장 상태" })).toContainText(
    "임시 저장됨",
  );
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.locator("#block-1").click();
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("선택한 구간의 문구").fill("첫 번째 탭의 최신 초안");
  await waitSavedText(page, "첫 번째 탭의 최신 초안");
  await other.frameLocator('iframe[title="아티클 미리보기"]').locator("#block-3").click();
  await expect(other.getByRole("status", { name: "자동 임시 저장 상태" })).toContainText(
    "다른 탭의 저장본",
  );
  expect(JSON.stringify(await saved(other))).toContain("첫 번째 탭의 최신 초안");
  await other.close();
});

test("손상된 임시 저장본은 덮어쓰지 않고 복원 실패를 알린다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  await expect(page.getByRole("status", { name: "자동 임시 저장 상태" })).toContainText(
    "임시 저장됨",
  );
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("motivo-editorial-drafts", 1);
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("drafts", "readwrite");
      transaction
        .objectStore("drafts")
        .put({ revision: 999, data: { version: 999 }, savedAt: Date.now() }, "workspace-v1");
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.getByRole("status", { name: "자동 임시 저장 상태" })).toContainText(
    "복원할 수 없어요",
  );
  expect(await saved(page)).toEqual({ version: 999 });
  await expect(page.getByLabel("샘플 글", { exact: true })).toHaveValue("describe-the-result");
});
