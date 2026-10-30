import fs from "node:fs/promises";
import { expect, test, type Page, type FrameLocator } from "@playwright/test";

async function openSelectedEditor(frame: FrameLocator) {
  if (await frame.getByRole("region", { name: "구간 스타일", exact: true }).isVisible()) return;
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
}

async function editorAction(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  if (!(await button.isVisible()))
    await page.getByRole("button", { name: "편집 도구 더보기", exact: true }).click();
  return button;
}

test("관리자 실험실에서 문구·블록을 수정하고 실제 렌더러로 확인한다", async ({ page }) => {
  await page.goto("/demo/admin");
  await page.getByRole("link", { name: "샘플 글로 편집기 시험하기 ↗" }).click();
  await expect(page.getByRole("toolbar", { name: "아티클 편집 도구" })).toBeVisible();
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await expect(frame.getByRole("heading", { level: 1 })).toContainText("원하는 결과");
  await expect(page.locator("input, textarea")).toHaveCount(0);
  await frame.getByRole("heading", { level: 1 }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "가운데 정렬", exact: true }).click();
  await expect(frame.getByRole("button", { name: "가운데 정렬", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator('iframe[title="아티클 미리보기"]').scrollIntoViewIfNeeded();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("선택한 구간의 문구").fill("실험실에서 다듬은 제목");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(frame.getByRole("heading", { level: 1 })).toHaveText("실험실에서 다듬은 제목");
  await page.getByRole("button", { name: "모바일 390", exact: true }).click();
  await expect(page.getByRole("button", { name: "모바일 390", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByLabel("샘플 글", { exact: true }).selectOption("show-the-screen");
  await expect(frame.getByRole("heading", { level: 1 })).toHaveText(/어디가[\s\S]*이상한가요/);
  await page.getByLabel("샘플 글", { exact: true }).selectOption("describe-the-result");
  await expect(frame.getByRole("heading", { level: 1 })).toHaveText("실험실에서 다듬은 제목");
  await page.goto("/workbook/reading/describe-the-result");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("원하는 결과");
  await expect(page.getByText("편집기로 바꾼 도입문입니다.", { exact: true })).toHaveCount(0);
});

test("잘못된 JSON은 미리보기에 반영하지 않고 유효한 문서만 내보낸다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await expect(frame.getByRole("heading", { level: 1 })).toContainText("원하는 결과");
  await (await editorAction(page, "원문 편집")).click();
  const field = page.getByLabel("에디토리얼 JSON", { exact: true });
  const original = JSON.parse(await field.inputValue());
  await field.fill(JSON.stringify({ ...original, version: 99 }));
  await page.getByRole("button", { name: "JSON 적용", exact: true }).click();
  await expect(page.getByRole("region", { name: "문서 편집" }).getByRole("alert")).toContainText(
    "적용 전에 확인해주세요.",
  );
  await expect(frame.getByRole("heading", { level: 1 })).toContainText("원하는 결과");
  await expect(await editorAction(page, "JSON 내보내기 ↗")).toBeDisabled();
  await field.fill(JSON.stringify({ ...original, title: "JSON에서 수정한 제목" }));
  await page.getByRole("button", { name: "JSON 적용", exact: true }).click();
  await expect(frame.getByRole("heading", { level: 1 })).toHaveText("JSON에서 수정한 제목");
  const downloadPromise = page.waitForEvent("download");
  await (await editorAction(page, "JSON 내보내기 ↗")).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("describe-the-result.json");
  const downloaded = JSON.parse(await fs.readFile((await download.path())!, "utf8"));
  expect(downloaded.title).toBe("JSON에서 수정한 제목");
  await page.reload();
  await expect(frame.getByRole("heading", { level: 1 })).toHaveText("JSON에서 수정한 제목");
});

test("미리보기에서 종류를 바꾸고 되돌린 뒤 새 문답 레이아웃을 내보낸다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const block = frame.locator('[id="block-1"]');
  await block.click();
  await openSelectedEditor(frame);
  await page.locator('iframe[title="아티클 미리보기"]').scrollIntoViewIfNeeded();
  await frame.getByText("종류 바꾸기", { exact: true }).click();
  await frame.getByRole("button", { name: "비교", exact: true }).click();
  await expect(frame.getByRole("button", { name: "종류 변경 적용", exact: true })).toBeDisabled();
  await expect(frame.getByLabel("나눌 내용")).toBeFocused();
  await expect(block).toHaveAttribute("data-block-type", "text");
  await frame.getByRole("button", { name: "← 종류 목록", exact: true }).click();
  await frame.getByRole("button", { name: "인용문", exact: true }).click();
  await expect(frame.getByRole("button", { name: "← 종류 목록", exact: true })).toBeVisible();
  await expect(frame.getByText("종류 바꾸기", { exact: true })).toHaveCount(0);
  await expect(frame.getByRole("button", { name: "내용 수정", exact: true })).toHaveCount(0);
  await frame.getByRole("button", { name: "← 종류 목록", exact: true }).click();
  await expect(block).toHaveAttribute("data-block-type", "text");
  await frame.getByRole("button", { name: "인용문", exact: true }).click();
  const live = frame.getByRole("region", { name: "변경 결과 미리보기", exact: true });
  await expect(live.locator("blockquote")).toContainText("글을 부탁했는데");
  await expect(live.locator("[id], [data-block-type]")).toHaveCount(0);
  await expect(block).toHaveAttribute("data-block-type", "text");
  await frame.getByRole("button", { name: "종류 변경 적용", exact: true }).click();
  await expect(block).toHaveAttribute("data-block-type", "quote");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await block.click();
  await openSelectedEditor(frame);
  await expect(block).toHaveAttribute("data-block-type", "text");
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame
    .getByLabel("선택한 구간의 문구")
    .fill("무엇을 먼저 확인할까요?\n\n원하는 결과를 확인해요.");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await frame.getByText("종류 바꾸기", { exact: true }).click();
  await frame.getByRole("button", { name: "질문과 답변", exact: true }).click();
  await frame.getByRole("button", { name: "종류 변경 적용", exact: true }).click();
  await expect(block).toHaveAttribute("data-block-type", "qa");
  await frame.getByRole("button", { name: "질문·답변 좌우", exact: true }).click();
  await expect(block.getByText("원하는 결과를 확인해요.", { exact: true })).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await (await editorAction(page, "JSON 내보내기 ↗")).click();
  const file = await (await downloaded).path();
  const document = JSON.parse(await fs.readFile(file!, "utf8"));
  expect(document.content[0]).toMatchObject({
    id: "block-1",
    type: "qa",
    layout: "columns",
    items: [{ question: "무엇을 먼저 확인할까요?", answer: "원하는 결과를 확인해요." }],
  });
  await (await editorAction(page, "원문 편집")).click();
  const raw = page.getByLabel("에디토리얼 JSON", { exact: true });
  await raw.fill(
    JSON.stringify({
      ...document,
      content: document.content.filter((entry: { id: string }) => entry.id !== "block-1"),
    }),
  );
  await page.getByRole("button", { name: "JSON 적용", exact: true }).click();
  await (await editorAction(page, "원문 편집")).click();
  await expect(frame.getByRole("region", { name: "구간 스타일" })).toHaveCount(0);
  await expect(frame.getByRole("heading", { level: 1 })).toContainText("원하는 결과");
});

test("구간 사이와 글 끝의 +에서 도식으로 요소를 골라 추가한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.getByRole("button", { name: "1번 구간 다음에 요소 추가", exact: true }).click();
  await page.locator('iframe[title="아티클 미리보기"]').scrollIntoViewIfNeeded();
  const picker = frame.getByRole("region", { name: "요소 추가", exact: true });
  await expect(picker.locator("svg")).toHaveCount(9);
  await picker.getByRole("button", { name: "핵심 메모", exact: true }).click();
  const inserted = frame.locator('[data-block-type="callout"]');
  await expect(inserted).toHaveCount(1);
  await expect(inserted).toContainText("덧붙일 내용을 적어주세요.");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(inserted).toHaveCount(0);
  await frame.getByRole("button", { name: "마지막에 요소 추가", exact: true }).click();
  await picker.getByRole("button", { name: "질문과 답변", exact: true }).click();
  await expect(frame.locator('[data-block-type="qa"]')).toHaveCount(1);
  const downloadPromise = page.waitForEvent("download");
  await (await editorAction(page, "JSON 내보내기 ↗")).click();
  const path = await (await downloadPromise).path();
  const result = JSON.parse(await fs.readFile(path!, "utf8"));
  expect(result.content.at(-1).type).toBe("qa");
  await expect(frame.getByRole("region", { name: "구간 스타일" })).toHaveCount(0);
  await frame.getByRole("button", { name: "첫 구간 앞에 요소 추가", exact: true }).click();
  await picker.getByRole("button", { name: "문단", exact: true }).click();
  await openSelectedEditor(frame);
  await expect(
    frame
      .getByRole("region", { name: "구간 스타일" })
      .getByRole("button", { name: "잡지 2단", exact: true })
      .locator("svg"),
  ).toHaveCount(1);
});

test("바깥 클릭은 팝업을 닫고 미적용 문구를 다시 선택할 때 복원한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const block = frame.locator('[id="block-1"]');
  const popup = frame.getByRole("region", { name: "구간 스타일" });
  await block.click();
  await openSelectedEditor(frame);
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("선택한 구간의 문구").fill("아직 적용하지 않은 문장");
  await frame.locator("main").click({ position: { x: 2, y: 20 } });
  await expect(popup).toHaveCount(0);
  await block.click();
  await openSelectedEditor(frame);
  await expect(frame.getByLabel("선택한 구간의 문구")).toHaveValue("아직 적용하지 않은 문장");
  await page.getByRole("button", { name: "편집 도구 더보기", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await block.click();
  await openSelectedEditor(frame);
  await expect(frame.getByLabel("선택한 구간의 문구")).toHaveValue("아직 적용하지 않은 문장");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(block).toHaveText("아직 적용하지 않은 문장");
  await frame.getByRole("heading", { name: /요청에 결과의 모양/ }).click();
  await openSelectedEditor(frame);
  await expect(popup.locator("header strong")).toHaveText("소제목");
  await frame.getByRole("button", { name: "마지막에 요소 추가", exact: true }).click();
  const insertion = frame.getByRole("region", { name: "요소 추가", exact: true });
  await expect(insertion).toBeVisible();
  await frame.locator("main").click({ position: { x: 2, y: 20 } });
  await expect(insertion).toHaveCount(0);
});

test("한 확인 화면에서 내용을 나누고 사진 조정·추가로 연결한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const block = frame.locator('[id="block-1"]');
  await block.click();
  await openSelectedEditor(frame);
  await frame.getByText("종류 바꾸기", { exact: true }).click();
  await frame.getByRole("button", { name: "비교", exact: true }).click();
  const change = frame.getByRole("button", { name: "종류 변경 적용", exact: true });
  await expect(change).toBeDisabled();
  await expect(frame.getByLabel("나눌 내용")).toBeFocused();
  await frame.getByLabel("나눌 내용").fill(" \n\n ");
  await expect(change).toBeDisabled();
  await frame.getByLabel("나눌 내용").fill("처음의 요청입니다.");
  await expect(change).toBeDisabled();
  const splitPreviewTab = frame.getByRole("tab", { name: "미리보기", exact: true });
  if (await splitPreviewTab.isVisible()) await splitPreviewTab.click();
  await frame
    .locator("[data-editor-tools] footer")
    .getByRole("button", {
      name: "나눌 내용에 두 내용을 적고, 사이에 빈 줄을 넣어주세요.",
      exact: true,
    })
    .click();
  await expect(frame.getByLabel("나눌 내용")).toBeFocused();
  await frame.getByLabel("나눌 내용").fill("처음의 요청입니다.\n\n조건을 더한 요청입니다.");
  await expect(change).toBeEnabled();
  await expect(block).toContainText("글을 부탁했는데");
  const previewTab = frame.getByRole("tab", { name: "미리보기", exact: true });
  if (await previewTab.isVisible()) await previewTab.click();
  const preview = frame
    .frameLocator('iframe[title="PC 구간 미리보기"]')
    .locator("[data-block-preview]");
  await expect(preview.locator("figure")).toContainText("처음의 요청입니다.");
  await expect(preview).toContainText("조건을 더한 요청입니다.");
  await expect(block).toHaveAttribute("data-block-type", "text");
  await frame.getByRole("button", { name: "종류 변경 적용", exact: true }).click();
  await expect(block).toHaveAttribute("data-block-type", "compare");
  await frame.getByText("종류 바꾸기", { exact: true }).click();
  await frame.getByRole("button", { name: "사진", exact: true }).click();
  await frame.getByRole("button", { name: "아래에 사진 추가", exact: true }).click();
  const image = frame.locator('[data-block-type="image"]');
  await expect(image).toHaveCount(1);
  await expect(block).toContainText("처음의 요청입니다.");
  await frame.getByText("종류 바꾸기", { exact: true }).click();
  await frame.getByRole("button", { name: "인용문", exact: true }).click();
  await frame.getByRole("button", { name: "사진 모양 바꾸기", exact: true }).click();
  await expect(frame.getByRole("button", { name: "세로 사진 · 4:5", exact: true })).toBeVisible();
  await expect(image).toHaveCount(1);
});

test("비교 제목과 문답을 원문 없이 수정하고 미리보기와 적용 내용을 일치시킨다", async ({
  page,
}) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const block = frame.locator('[id="block-3"]');
  await block.click();
  await openSelectedEditor(frame);
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("항목 1 제목", { exact: true }).fill("");
  await expect(frame.getByRole("button", { name: "내용 적용", exact: true })).toBeDisabled();
  await frame.getByLabel("항목 1 제목", { exact: true }).fill("처음 보낸 요청");
  await frame.getByLabel("항목 1 내용", { exact: true }).fill("독자가 정해지기 전의 요청입니다.");
  const contentPreviewTab = frame.getByRole("tab", { name: "미리보기", exact: true });
  if (await contentPreviewTab.isVisible()) await contentPreviewTab.click();
  const touchDevice = test.info().project.name === "mobile";
  await expect(
    frame.getByText(
      touchDevice
        ? "두 손가락으로 확대·축소, 한 손가락으로 이동"
        : "Ctrl+휠로 확대·축소, 드래그로 이동",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    frame.getByText(
      touchDevice
        ? "Ctrl+휠로 확대·축소, 드래그로 이동"
        : "두 손가락으로 확대·축소, 한 손가락으로 이동",
      { exact: true },
    ),
  ).toBeHidden();
  const contentPreview = frame
    .frameLocator('iframe[title="PC 구간 미리보기"]')
    .locator("[data-block-preview]");
  await expect(contentPreview).toContainText("독자가 정해지기 전의 요청입니다.");
  await frame.getByRole("button", { name: "100%", exact: true }).click();
  await expect(frame.getByRole("button", { name: "100%", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const panArea = frame.getByLabel("확대 미리보기 스크롤", { exact: true });
  const panBox = await panArea.boundingBox();
  if (!panBox) throw new Error("미리보기 이동 영역이 없습니다.");
  await page.mouse.move(panBox.x + panBox.width * 0.8, panBox.y + 30);
  await page.mouse.down();
  await page.mouse.move(panBox.x + panBox.width * 0.2, panBox.y + 30, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => panArea.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await page.mouse.move(panBox.x + panBox.width / 2, panBox.y + 40);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -40);
  await page.keyboard.up("Control");
  await expect
    .poll(async () => {
      const label = await frame.getByRole("group", { name: "미리보기 배율" }).innerText();
      return Number(label.match(/·\s*(\d+)%/)?.[1]);
    })
    .toBeGreaterThan(100);
  await frame.getByRole("button", { name: "100%", exact: true }).click();
  const touchSession = await page.context().newCDPSession(page);
  const centerX = panBox.x + panBox.width / 2;
  const centerY = panBox.y + 60;
  await touchSession.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: centerX - 20, y: centerY, id: 0 },
      { x: centerX + 20, y: centerY, id: 1 },
    ],
  });
  await touchSession.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: centerX - 30, y: centerY, id: 0 },
      { x: centerX + 30, y: centerY, id: 1 },
    ],
  });
  await touchSession.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(frame.getByRole("group", { name: "미리보기 배율" })).toContainText("150%");
  await touchSession.detach();
  await frame.getByRole("button", { name: "100%", exact: true }).click();

  await frame.getByRole("button", { name: "미리보기 확대", exact: true }).click();
  await expect(frame.getByRole("group", { name: "미리보기 배율" })).toContainText("125%");
  await frame.getByRole("button", { name: "미리보기 축소", exact: true }).click();
  await expect(frame.getByRole("group", { name: "미리보기 배율" })).toContainText("100%");
  await frame.getByRole("button", { name: "전체 맞춤", exact: true }).click();
  await expect(frame.getByRole("button", { name: "전체 맞춤", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(block).not.toContainText("독자가 정해지기 전의 요청입니다.");

  await page.getByRole("button", { name: "편집 도구 더보기", exact: true }).click();
  await block.click();
  await openSelectedEditor(frame);
  await expect(frame.getByLabel("항목 1 제목", { exact: true })).toHaveValue("처음 보낸 요청");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(block).toContainText("처음 보낸 요청");
  await frame.getByText("종류 바꾸기", { exact: true }).click();
  await frame.getByRole("button", { name: "질문과 답변", exact: true }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("질문 1", { exact: true }).fill("누구에게 보여줄까요?");
  await frame.getByLabel("답변 1", { exact: true }).fill("");
  await expect(frame.getByRole("button", { name: "종류 변경 적용", exact: true })).toBeDisabled();
  await expect(
    frame.getByRole("button", { name: "종류 변경 적용", exact: true }),
  ).toHaveAccessibleDescription("답변 1을 입력해주세요.");
  await frame.getByLabel("답변 1", { exact: true }).fill("AI를 처음 쓰는 사람에게 보여줘요.");
  const previewTab = frame.getByRole("tab", { name: "미리보기", exact: true });
  if (await previewTab.isVisible()) await previewTab.click();
  const preview = frame
    .frameLocator('iframe[title="PC 구간 미리보기"]')
    .locator("[data-block-preview]");
  await expect(preview).toContainText("누구에게 보여줄까요?");
  await expect(preview).toContainText("AI를 처음 쓰는 사람에게 보여줘요.");
  await frame.getByRole("button", { name: "종류 변경 적용", exact: true }).click();
  await expect(block).toHaveAttribute("data-block-type", "qa");
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("답변 1", { exact: true }).fill("같이 만들어볼 친구에게 보여줘요.");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(block).toContainText("같이 만들어볼 친구에게 보여줘요.");
});

test("문서 적용·내보내기 상태와 글별 실행 취소·다시 실행을 관리한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const block = frame.locator('[id="block-1"]');
  await block.click();
  await openSelectedEditor(frame);
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  const input = frame.getByLabel("선택한 구간의 문구");
  await input.fill("실행 취소를 확인하는 문장입니다.");
  await expect(page.getByText("편집 중 · 미적용 내용 있음", { exact: false })).toBeVisible();
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(block).toContainText("실행 취소를 확인하는 문장입니다.");
  await expect(page.getByText("문서에 반영됨 · 파일 보관 필요", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(block).not.toContainText("실행 취소를 확인하는 문장입니다.");
  await page.getByRole("button", { name: "다시 실행", exact: true }).click();
  await expect(block).toContainText("실행 취소를 확인하는 문장입니다.");
  await block.click();
  await openSelectedEditor(frame);
  await block.press("Control+z");
  await expect(block).not.toContainText("실행 취소를 확인하는 문장입니다.");
  await block.press("Control+Shift+z");
  await expect(block).toContainText("실행 취소를 확인하는 문장입니다.");
  await page.getByLabel("샘플 글", { exact: true }).selectOption("show-the-screen");
  await expect(page.getByRole("button", { name: "실행 취소", exact: true })).toBeDisabled();
  await page.getByLabel("샘플 글", { exact: true }).selectOption("describe-the-result");
  await expect(block).toContainText("실행 취소를 확인하는 문장입니다.");
  const downloaded = page.waitForEvent("download");
  await (await editorAction(page, "JSON 내보내기 ↗")).click();
  await downloaded;
  await expect(page.getByText("내보냄 · 서버 저장 아님", { exact: false })).toBeVisible();
  await block.click();
  await openSelectedEditor(frame);
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await input.fill("새 변경입니다.");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(page.getByRole("button", { name: "다시 실행", exact: true })).toBeDisabled();
});

test("사진 캡션도 같은 작업 화면에서 수정하고 되돌린다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.getByRole("button", { name: "마지막에 요소 추가", exact: true }).click();
  await frame.getByRole("button", { name: "사진", exact: true }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("사진 캡션", { exact: true }).fill("");
  await expect(frame.getByRole("button", { name: "내용 적용", exact: true })).toBeDisabled();
  await frame.getByLabel("사진 캡션", { exact: true }).fill("새로 다듬은 사진 설명입니다.");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(frame.locator('[data-block-type="image"]')).toContainText(
    "새로 다듬은 사진 설명입니다.",
  );
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(frame.locator('[data-block-type="image"]')).not.toContainText(
    "새로 다듬은 사진 설명입니다.",
  );
});

for (const [kind, itemName, minimum] of [
  ["비교", "항목", 2],
  ["질문과 답변", "문답", 1],
  ["요점 목록", "항목", 2],
] as const) {
  test(`${kind} 항목을 추가·이동·삭제하고 적용 후 되돌린다`, async ({ page }) => {
    await page.goto("/demo/admin/articles");
    const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
    await frame.getByRole("button", { name: "마지막에 요소 추가", exact: true }).click();
    await frame.getByRole("button", { name: kind, exact: true }).click();
    await openSelectedEditor(frame);
    await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
    const title = (index: number) =>
      frame.getByLabel(kind === "질문과 답변" ? `질문 ${index}` : `항목 ${index} 제목`, {
        exact: true,
      });
    const body = (index: number) =>
      frame.getByLabel(kind === "질문과 답변" ? `답변 ${index}` : `항목 ${index} 내용`, {
        exact: true,
      });
    await expect(
      frame.getByRole("button", { name: `${itemName} 1 삭제`, exact: true }),
    ).toBeDisabled();
    await frame.getByRole("button", { name: `+ ${itemName} 추가`, exact: true }).click();
    await expect(frame.getByRole("button", { name: "내용 적용", exact: true })).toBeDisabled();
    await title(minimum + 1).fill("새 항목의 제목");
    await body(minimum + 1).fill("새 항목의 내용입니다.");
    if (kind === "비교")
      await expect(
        frame.getByRole("button", { name: `+ ${itemName} 추가`, exact: true }),
      ).toBeDisabled();
    await frame
      .getByRole("button", { name: `${itemName} ${minimum + 1} 위로 이동`, exact: true })
      .click();
    await expect(title(minimum)).toHaveValue("새 항목의 제목");
    await expect(body(minimum)).toHaveValue("새 항목의 내용입니다.");
    await frame
      .getByRole("button", { name: `${itemName} ${minimum} 아래로 이동`, exact: true })
      .click();
    await expect(title(minimum + 1)).toHaveValue("새 항목의 제목");
    await frame.getByRole("button", { name: `${itemName} 1 삭제`, exact: true }).click();
    await expect(title(minimum)).toHaveValue("새 항목의 제목");
    await expect(
      frame.getByRole("button", { name: `${itemName} 1 삭제`, exact: true }),
    ).toBeDisabled();
    await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
    const type = kind === "비교" ? "compare" : kind === "질문과 답변" ? "qa" : "list";
    const added = frame.locator(`[data-block-type="${type}"]`).last();
    await expect(added).toContainText("새 항목의 제목");
    await page.getByRole("button", { name: "실행 취소", exact: true }).click();
    await expect(added).not.toContainText("새 항목의 제목");
    await page.getByRole("button", { name: "다시 실행", exact: true }).click();
    await expect(added).toContainText("새 항목의 제목");
  });
}

test("읽기 화면은 편집 표시를 숨기고 미적용 초안을 유지한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const block = frame.locator('[id="block-1"]');
  await block.click();
  await openSelectedEditor(frame);
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("선택한 구간의 문구", { exact: true }).fill("읽기 전환 뒤에도 남길 초안");
  await page.getByRole("button", { name: "읽기 화면", exact: true }).click();
  await expect(frame.locator("[data-editor-tools]")).toHaveCount(0);
  await expect(frame.locator('[data-editor-selected="true"]')).toHaveCount(0);
  await expect(block).not.toContainText("읽기 전환 뒤에도 남길 초안");
  await block.click();
  await expect(frame.locator("[data-editor-tools]")).toHaveCount(0);
  await page.getByRole("button", { name: "읽기 화면", exact: true }).click();
  await expect(
    frame.getByRole("button", { name: "첫 구간 앞에 요소 추가", exact: true }),
  ).toBeVisible();
  await block.click();
  await openSelectedEditor(frame);
  await expect(frame.getByLabel("선택한 구간의 문구", { exact: true })).toHaveValue(
    "읽기 전환 뒤에도 남길 초안",
  );
});

test("필요할 때 구간 목록을 열어 검색·이동하고 현재 수정 위치를 표시한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const list = page.getByRole("complementary", { name: "구간 목록", exact: true });
  const toggle = page.getByRole("button", { name: "구간 목록", exact: true });
  await expect(list).toHaveCount(0);
  await toggle.click();
  await expect(page.getByLabel("구간 검색", { exact: true })).toBeFocused();
  await page.getByLabel("구간 검색", { exact: true }).fill("없는 검색어입니다");
  await expect(list.getByText("일치하는 구간이 없어요. 다른 문구로 찾아보세요.")).toBeVisible();
  await page.getByLabel("구간 검색", { exact: true }).fill("비교");
  await list.getByRole("button", { name: /4번째 구간 · 비교/ }).click();
  await openSelectedEditor(frame);
  await expect(list).toHaveCount(0);
  await expect(
    frame
      .getByRole("region", { name: "구간 스타일" })
      .getByText("4번째 구간 · 비교", { exact: true }),
  ).toBeVisible();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await expect(
    frame
      .getByRole("region", { name: "구간 스타일" })
      .getByText("4번째 구간 · 비교", { exact: true }),
  ).toBeVisible();
  await frame.getByLabel("항목 1 제목", { exact: true }).fill("목록 이동 중에도 남길 초안");
  await toggle.click();
  await expect(list.locator('[aria-current="location"]')).toContainText("4번째 구간 · 비교");
  await page.getByLabel("구간 검색", { exact: true }).fill("인용문");
  await list.getByRole("button", { name: /9번째 구간 · 인용문/ }).click();
  await openSelectedEditor(frame);
  await expect(
    frame
      .getByRole("region", { name: "구간 스타일" })
      .getByText("9번째 구간 · 인용문", { exact: true }),
  ).toBeVisible();
  await toggle.click();
  await page.getByLabel("구간 검색", { exact: true }).fill("비교");
  await list.getByRole("button", { name: /4번째 구간 · 비교/ }).click();
  await openSelectedEditor(frame);
  await expect(frame.getByLabel("항목 1 제목", { exact: true })).toHaveValue(
    "목록 이동 중에도 남길 초안",
  );
  await toggle.click();
  await page.getByLabel("구간 검색", { exact: true }).press("Escape");
  await expect(list).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await page.getByRole("button", { name: "읽기 화면", exact: true }).click();
  await toggle.click();
  await list.getByRole("button", { name: /표지/ }).click();
  await expect(frame.locator("[data-editor-tools]")).toHaveCount(0);
  await expect(frame.getByRole("heading", { level: 1 })).toBeInViewport();
});

test("적용 버튼 옆에서 빠진 답변을 확인하고 채우면 안내가 사라진다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.getByRole("button", { name: "마지막에 요소 추가", exact: true }).click();
  await frame.getByRole("button", { name: "질문과 답변", exact: true }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByRole("button", { name: "+ 문답 추가", exact: true }).click();
  await frame.getByLabel("질문 2", { exact: true }).fill("어떤 내용을 채워야 하나요?");
  const apply = frame.getByRole("button", { name: "내용 적용", exact: true });
  const footer = frame.locator("[data-editor-tools] footer");
  await expect(apply).toBeDisabled();
  await expect(apply).toHaveAccessibleDescription("답변 2를 입력해주세요.");
  await expect(footer.getByRole("status")).toHaveText("답변 2를 입력해주세요.");
  await expect(frame.getByLabel("답변 2", { exact: true })).toHaveAttribute("aria-invalid", "true");
  const previewTab = frame.getByRole("tab", { name: "미리보기", exact: true });
  if (await previewTab.isVisible()) {
    await previewTab.click();
    await expect(footer.getByRole("status")).toHaveText("답변 2를 입력해주세요.");
  }
  await footer.getByRole("button", { name: "답변 2를 입력해주세요.", exact: true }).click();
  if (await previewTab.isVisible())
    await expect(frame.getByRole("tab", { name: "내용 수정", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  await expect(frame.getByLabel("답변 2", { exact: true })).toBeFocused();
  await expect(frame.getByLabel("질문 2", { exact: true })).toHaveValue(
    "어떤 내용을 채워야 하나요?",
  );
  await frame.getByLabel("답변 2", { exact: true }).fill("이 답변을 채우면 적용할 수 있어요.");
  await expect(apply).toBeEnabled();
  await expect(footer.getByRole("status")).toHaveCount(0);
  await expect(frame.getByLabel("답변 2", { exact: true })).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await apply.click();
  await expect(frame.locator('[data-block-type="qa"]').last()).toContainText(
    "이 답변을 채우면 적용할 수 있어요.",
  );
});

test("변경 없는 구간은 미적용으로 잡지 않고 새 글과 기본정보를 내보내 다시 불러온다", async ({
  page,
}) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.getByRole("heading", { level: 1 }).click();
  await openSelectedEditor(frame);
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await page
    .getByRole("heading", { name: "아티클 편집기" })
    .evaluate((element) => (element as HTMLElement).click());
  await (
    await editorAction(page, "JSON 내보내기 ↗")
  )
    .isEnabled()
    .then((value) => expect(value).toBe(true));
  await (await editorAction(page, "새 글")).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("글 주소", { exact: false }).fill("authoring-test");
  await dialog.getByLabel("글 제목 · 목록과 공유에 표시").fill("직접 작성한 글");
  await dialog.getByRole("button", { name: "글 열기", exact: true }).click();
  await expect(frame.getByRole("heading", { level: 1 })).toHaveText("직접 작성한 글");
  await (await editorAction(page, "글 기본정보")).click();
  await dialog.getByLabel("글 제목 · 목록과 공유에 표시").fill("기본정보 수정 완료");
  await dialog.getByRole("button", { name: "기본정보 적용" }).click();
  await expect(frame.getByRole("heading", { level: 1 })).toHaveText("기본정보 수정 완료");
  const downloadPromise = page.waitForEvent("download");
  await (await editorAction(page, "JSON 내보내기 ↗")).click();
  const download = await downloadPromise;
  const data = JSON.parse(await fs.readFile((await download.path())!, "utf8"));
  expect(data.title).toBe("기본정보 수정 완료");
  await (await editorAction(page, "JSON 불러오기")).click();
  await dialog.getByLabel("JSON 파일").setInputFiles({
    name: "article.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await dialog.getByRole("button", { name: "글 열기", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("이미 사용 중인 주소");
  await dialog.getByLabel("글 주소", { exact: false }).fill("imported-test");
  await dialog.getByRole("button", { name: "글 열기", exact: true }).click();
  await expect(page.getByLabel("샘플 글", { exact: true })).toHaveValue("imported-test");
  await expect(frame.getByRole("heading", { level: 1 })).toHaveText("기본정보 수정 완료");
});

test("구간 복제·이동·삭제를 글별 실행 취소와 다시 실행으로 복원한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  await page.getByLabel("샘플 글", { exact: true }).selectOption("show-the-screen");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.locator("#block-4 img").click();
  const actions = frame.getByRole("group", { name: "구간 관리" });
  await expect(actions).toBeVisible();
  await expect(frame.locator("section[data-editor-tools] [data-inline-block-tools]")).toHaveCount(
    0,
  );
  await expect(actions.getByRole("button", { name: "구간 삭제", exact: true })).toHaveCount(0);
  await actions.getByRole("button", { name: "구간 관리 더보기", exact: true }).click();
  await expect(actions.getByRole("button", { name: "구간 삭제", exact: true })).toBeVisible();
  await actions.getByRole("button", { name: "구간 관리 더보기", exact: true }).press("Escape");
  await expect(actions.getByRole("button", { name: "구간 삭제", exact: true })).toHaveCount(0);

  await actions.getByRole("button", { name: "구간 복제", exact: true }).click();
  const selected = frame.locator('[data-editor-selected="true"]');
  const cloneId = (await selected.getAttribute("id"))!;
  expect(cloneId).not.toBe("block-4");
  await expect(selected).toHaveAttribute("data-block-type", "split");
  const children = await selected
    .locator("[data-block-type]")
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(children.length).toBeGreaterThan(0);
  expect(new Set(children).size).toBe(children.length);
  await expect(frame.locator('[data-block-type="split"]')).toHaveCount(2);
  const position = async () => {
    await openSelectedEditor(frame);
    const value = await frame.locator("section[data-editor-tools] header").innerText();
    await frame.getByRole("button", { name: "편집 닫기 ×", exact: true }).click();
    return value;
  };
  expect(await position()).toContain("6번째");
  await actions.getByRole("button", { name: "↑ 위로 이동", exact: true }).click();
  expect(await position()).toContain("5번째");
  await actions.getByRole("button", { name: "↓ 아래로 이동", exact: true }).click();
  expect(await position()).toContain("6번째");
  await actions.getByRole("button", { name: "구간 관리 더보기", exact: true }).click();
  await actions.getByRole("button", { name: "구간 삭제", exact: true }).click();
  await expect(frame.locator(`#${cloneId}`)).toHaveCount(0);
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(frame.locator(`#${cloneId}`)).toHaveCount(1);
  await page.getByRole("button", { name: "다시 실행", exact: true }).click();
  await expect(frame.locator(`#${cloneId}`)).toHaveCount(0);
  // 문서 전환 뒤에도 해당 글의 기록을 유지한다.
  await page.getByLabel("샘플 글", { exact: true }).selectOption("describe-the-result");
  await expect(page.getByRole("button", { name: "실행 취소", exact: true })).toBeDisabled();
  await page.getByLabel("샘플 글", { exact: true }).selectOption("show-the-screen");
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(frame.locator(`#${cloneId}`)).toHaveCount(1);
  const downloading = page.waitForEvent("download");
  await (await editorAction(page, "JSON 내보내기 ↗")).click();
  const result = JSON.parse(await fs.readFile((await (await downloading).path())!, "utf8"));
  expect(result.content[5].id).toBe(cloneId);
  expect(result.content[5].content.map((child: { id: string }) => child.id)).toEqual(children);
});

test("사진 내부 구간도 정리하며 미적용 내용과 마지막 구간을 보호한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  await page.getByLabel("샘플 글", { exact: true }).selectOption("show-the-screen");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const child = frame.locator("#block-4 [data-block-type]").first();
  const originalId = (await child.getAttribute("id"))!;
  await child.click();
  const actions = frame.getByRole("group", { name: "구간 관리" });
  await expect(actions.getByRole("button", { name: "↑ 위로 이동", exact: true })).toBeDisabled();
  await actions.getByRole("button", { name: "구간 복제", exact: true }).click();
  const clonedId = (await frame.locator('[data-editor-selected="true"]').getAttribute("id"))!;
  await expect(frame.locator("#block-4 [data-block-type]")).toHaveCount(2);
  await actions.getByRole("button", { name: "↑ 위로 이동", exact: true }).click();
  await expect(frame.locator("#block-4 [data-block-type]").first()).toHaveAttribute("id", clonedId);
  await actions.getByRole("button", { name: "구간 관리 더보기", exact: true }).click();
  await actions.getByRole("button", { name: "구간 삭제", exact: true }).click();
  await expect(frame.locator(`#${originalId}`)).toHaveCount(1);
  // 다른 구간에 미적용 문구가 있으면 구조 변경을 막고 초안을 보존한다.
  await frame.locator("#block-1").click();
  await openSelectedEditor(frame);
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  const input = frame.getByLabel("선택한 구간의 문구");
  const oldText = await input.inputValue();
  await input.fill("아직 적용하지 않은 문단");
  await page.getByRole("button", { name: "읽기 화면", exact: true }).click();
  await page.getByRole("button", { name: "읽기 화면", exact: true }).click();
  await frame.locator("#block-4 img").click();
  await actions.getByRole("button", { name: "구간 관리 더보기", exact: true }).click();
  await expect(actions.getByRole("button", { name: "구간 삭제", exact: true })).toBeDisabled();
  await expect(actions).toContainText("미적용 내용을 먼저");
  await frame.locator("#block-1").click();
  await openSelectedEditor(frame);
  await expect(input).toHaveValue("아직 적용하지 않은 문단");
  await input.fill(oldText);
  await page.getByRole("button", { name: "읽기 화면", exact: true }).click();
  await page.getByRole("button", { name: "읽기 화면", exact: true }).click();
  await frame.locator("#block-4 img").click();
  await actions.getByRole("button", { name: "구간 관리 더보기", exact: true }).click();
  await expect(actions.getByRole("button", { name: "구간 삭제", exact: true })).toBeEnabled();
  // 새 글의 유일한 본문은 삭제하지 않는다.
  await (await editorAction(page, "새 글")).click();
  await page.getByRole("dialog").getByLabel("글 주소", { exact: false }).fill("one-section");
  await page.getByRole("button", { name: "글 열기", exact: true }).click();
  await frame.locator("#intro").click();
  await actions.getByRole("button", { name: "구간 관리 더보기", exact: true }).click();
  await expect(actions.getByRole("button", { name: "구간 삭제", exact: true })).toBeDisabled();
  await expect(actions).toContainText("하나 이상 남겨주세요");
});

test("구간 선택은 도구막대만 열고 편집을 눌러야 팝업을 연다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const block = frame.locator("#block-1");
  const popup = frame.getByRole("region", { name: "구간 스타일", exact: true });
  await block.click();
  await expect(popup).toHaveCount(0);
  await expect(frame.getByRole("button", { name: "구간 편집", exact: true })).toBeVisible();
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
  await expect(popup).toBeVisible();
  await frame.getByRole("button", { name: "내용 수정", exact: true }).click();
  await frame.getByLabel("선택한 구간의 문구").fill("닫은 뒤에도 남아 있는 초안");
  await frame.getByRole("button", { name: "편집 닫기 ×", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(block).toHaveAttribute("data-editor-selected", "true");
  await frame.getByRole("button", { name: "구간 편집", exact: true }).click();
  await expect(frame.getByLabel("선택한 구간의 문구")).toHaveValue("닫은 뒤에도 남아 있는 초안");
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await frame.getByRole("button", { name: "편집 닫기 ×", exact: true }).click();
  await frame.getByRole("button", { name: "구간 복제", exact: true }).click();
  await expect(popup).toHaveCount(0);
  await expect(frame.locator('[data-editor-selected="true"]')).not.toHaveAttribute("id", "block-1");
});

test("표지 사진을 골라 미리 보고 초안을 복원·적용한 뒤 실행 취소한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.getByRole("heading", { level: 1 }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "사진 바꾸기", exact: true }).click();
  await frame.getByRole("button", { name: /사진 선택: 설명하기 어렵다면/ }).click();
  const preview = frame.frameLocator('iframe[title="PC 구간 미리보기"]');
  const previewTab = frame.getByRole("tab", { name: "미리보기", exact: true });
  if (await previewTab.isVisible()) await previewTab.click();
  await expect(preview.locator("img").first()).toHaveAttribute("src", /show-the-screen-v1/);
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute(
    "src",
    /describe-the-result-v1/,
  );
  await frame.getByRole("button", { name: "편집 닫기 ×", exact: true }).click();
  await expect(page.getByText("편집 중 · 미적용 내용 있음", { exact: true })).toBeVisible();
  await openSelectedEditor(frame);
  await expect(frame.getByRole("button", { name: /사진 선택: 설명하기 어렵다면/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await frame.getByLabel("사진 설명", { exact: true }).fill("화면을 가리키며 살펴보는 손");
  await frame.getByLabel("사진 캡션", { exact: true }).fill("");
  await expect(frame.getByRole("button", { name: "사진 적용", exact: true })).toBeDisabled();
  if (await previewTab.isVisible()) await previewTab.click();
  await frame
    .locator("section[data-editor-tools] footer")
    .getByRole("button", { name: "사진 캡션을 입력해주세요.", exact: true })
    .click();
  await expect(frame.getByLabel("사진 캡션", { exact: true })).toBeFocused();
  await frame.getByLabel("사진 캡션", { exact: true }).fill("표지로 선택한 연출 사진");
  await frame.getByRole("button", { name: "사진 적용", exact: true }).click();
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute(
    "src",
    /show-the-screen-v1/,
  );
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute(
    "alt",
    "화면을 가리키며 살펴보는 손",
  );
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute(
    "src",
    /describe-the-result-v1/,
  );
  await page.getByRole("button", { name: "다시 실행", exact: true }).click();
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute(
    "src",
    /show-the-screen-v1/,
  );
});

test("본문 사진과 사진·글의 사진을 바꾸며 기존 문장과 배치를 유지한다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  await page.getByLabel("샘플 글", { exact: true }).selectOption("show-the-screen");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  const beforeText = (await frame.locator("#block-5").textContent())!;
  await frame.locator("#block-4 img").click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "사진 바꾸기", exact: true }).click();
  await frame.getByRole("button", { name: /사진 선택: ‘알아서 잘’ 대신/ }).click();
  const previewTab = frame.getByRole("tab", { name: "미리보기", exact: true });
  if (await previewTab.isVisible()) await previewTab.click();
  const preview = frame.frameLocator('iframe[title="PC 구간 미리보기"]');
  await expect(preview.locator("img").first()).toHaveAttribute("src", /describe-the-result-v1/);
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(frame.locator("#block-4 img")).toHaveAttribute("src", /describe-the-result-v1/);
  await expect(frame.locator("#block-5")).toHaveText(beforeText);
  await frame.getByRole("button", { name: "편집 닫기 ×", exact: true }).click();
  await frame.getByRole("button", { name: "마지막에 요소 추가", exact: true }).click();
  await frame.getByRole("button", { name: "사진", exact: true }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "사진 바꾸기", exact: true }).click();
  await frame.getByRole("button", { name: /사진 선택: 새 대화에서/ }).click();
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  const photo = frame.locator('[data-block-type="image"]').last();
  await expect(photo.locator("img")).toHaveAttribute("src", /leave-a-handoff-v1/);
  const downloadPromise = page.waitForEvent("download");
  await (await editorAction(page, "JSON 내보내기 ↗")).click();
  const data = JSON.parse(await fs.readFile((await (await downloadPromise).path())!, "utf8"));
  const split = data.content.find((block: { id: string }) => block.id === "block-4");
  expect(split.image.ratio).toBe("square");
  expect(split.image.focus).toBe("right");
  expect(split.image.crop).toBe("detail");
  expect(split.content[0].id).toBe("block-5");
  expect(data.content.at(-1).image.src).toContain("leave-a-handoff-v1");
});

test("내 컴퓨터 사진을 표지에 추가하고 JSON 왕복 뒤 본문에서도 다시 고른다", async ({ page }) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.getByRole("heading", { level: 1 }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "사진 바꾸기", exact: true }).click();
  const buffer = await fs.readFile("public/images/workbook/notes/show-the-screen-v1.png");
  await frame
    .getByLabel("내 컴퓨터에서 사진 추가", { exact: true })
    .setInputFiles({ name: "my-photo.png", mimeType: "image/png", buffer });
  await expect(
    frame.getByRole("button", { name: "사진 선택: my-photo.png", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const previewTab = frame.getByRole("tab", { name: "미리보기", exact: true });
  if (await previewTab.isVisible()) await previewTab.click();
  await expect(
    frame.frameLocator('iframe[title="PC 구간 미리보기"]').locator("img").first(),
  ).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
  await frame.getByRole("button", { name: "사진 적용", exact: true }).click();
  const src = (await frame.locator("[data-cover-layout] img").first().getAttribute("src"))!;
  expect(src).toMatch(/^data:image\/jpeg;base64,/);
  await page.getByRole("button", { name: "실행 취소", exact: true }).click();
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute(
    "src",
    /describe-the-result/,
  );
  await page.getByRole("button", { name: "다시 실행", exact: true }).click();
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute("src", src);
  const downloadPromise = page.waitForEvent("download");
  await (await editorAction(page, "JSON 내보내기 ↗")).click();
  const bytes = await fs.readFile((await (await downloadPromise).path())!);
  expect(JSON.parse(bytes.toString()).thumbnail).toBe(src);
  await page.reload();
  await (await editorAction(page, "JSON 불러오기")).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("JSON 파일")
    .setInputFiles({ name: "with-photo.json", mimeType: "application/json", buffer: bytes });
  await dialog.getByLabel("글 주소", { exact: false }).fill("my-uploaded-article");
  await dialog.getByRole("button", { name: "글 열기", exact: true }).click();
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute("src", src);
  await frame.getByRole("button", { name: "마지막에 요소 추가", exact: true }).click();
  await frame.getByRole("button", { name: "사진", exact: true }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "사진 바꾸기", exact: true }).click();
  await frame.locator('button:has(> img[src^="data:image/jpeg"])').click();
  await frame.getByRole("button", { name: "내용 적용", exact: true }).click();
  await expect(frame.locator('[data-block-type="image"] img').last()).toHaveAttribute("src", src);
});

test("사진 추가는 잘못된 형식·손상된 파일·초과 용량을 안내하고 현재 사진을 유지한다", async ({
  page,
}) => {
  await page.goto("/demo/admin/articles");
  const frame = page.frameLocator('iframe[title="아티클 미리보기"]');
  await frame.getByRole("heading", { level: 1 }).click();
  await openSelectedEditor(frame);
  await frame.getByRole("button", { name: "사진 바꾸기", exact: true }).click();
  const input = frame.getByLabel("내 컴퓨터에서 사진 추가", { exact: true });
  await input.setInputFiles({
    name: "vector.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
  });
  await expect(
    frame.getByRole("group", { name: "사진 선택", exact: true }).getByRole("alert"),
  ).toContainText("JPEG·PNG·WebP");
  await input.setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("broken image"),
  });
  await expect(
    frame.getByRole("group", { name: "사진 선택", exact: true }).getByRole("alert"),
  ).toContainText("사진을 읽을 수 없어요");
  await input.setInputFiles({
    name: "large.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(
    frame.getByRole("group", { name: "사진 선택", exact: true }).getByRole("alert"),
  ).toContainText("10MB 이하");
  await expect(frame.locator("[data-cover-layout] img").first()).toHaveAttribute(
    "src",
    /describe-the-result/,
  );
  await frame.getByRole("button", { name: "취소", exact: true }).click();
  await expect(page.getByText("샘플 원본 · 변경 없음", { exact: true })).toBeVisible();
});
