import { expect, test, goToPreviousLesson } from "./workbook-test";

test("홈페이지 기획은 첫 파일을 이어 쓰고 편집한 요청을 보존한다", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/page-planning");
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  const body = page.getByLabel("수업 내용", { exact: true });
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  async function capture(screen: number) {
    await expect(progress).toHaveText(new RegExp(`화면 ${screen} / 5$`));
    if (testInfo.project.name === "desktop")
      await expect
        .poll(() => body.evaluate((el) => el.scrollHeight - el.clientHeight))
        .toBeLessThanOrEqual(2);
    await page.screenshot({ path: testInfo.outputPath(`planning-${screen}.png`) });
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("홈페이지 기획하기");
  await expect(body).toContainText("my-first-web/index.html");
  await capture(1);
  await next.click();
  await expect(next).toBeDisabled();
  await page
    .getByRole("textbox", { name: "누가 읽나요?", exact: true })
    .fill("나와 비슷한 취향의 친구");
  await expect(next).toBeDisabled();
  await page
    .getByRole("textbox", { name: "읽은 뒤 무엇을 하길 바라나요?", exact: true })
    .fill("추천 목록을 살펴보기");
  await page.getByRole("button", { name: "빈 항목에 구성 예시 넣기", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "누가 읽나요?", exact: true })).toHaveValue(
    "나와 비슷한 취향의 친구",
  );
  await capture(2);
  await next.click();
  await page
    .getByRole("textbox", { name: "홈페이지 제목", exact: true })
    .fill("직접 써본 도구 모음");
  await page
    .getByRole("textbox", { name: "첫 소개 문장", exact: true })
    .fill("직접 써본 도구와 배운 점을 소개합니다.");
  await capture(3);
  await next.click();
  await page.getByRole("textbox", { name: "소개할 내용 · 한 줄에 하나", exact: true }).fill("");
  await expect(next).toBeDisabled();
  await page
    .getByRole("textbox", { name: "소개할 내용 · 한 줄에 하나", exact: true })
    .fill("도구 A를 써본 기록\n도구 B에서 배운 점");
  await capture(4);
  await next.click();
  await capture(5);
  await expect(body).toContainText("직접 써본 도구 모음");
  await page.getByRole("button", { name: "제작 요청 다듬기로 →", exact: true }).click();
  await expect(page).toHaveURL(/\/lessons\/page-request$/);
  await page.getByRole("button", { name: "내 기획으로 요청 초안 만들기", exact: true }).click();
  await next.click();
  const request = page.getByRole("textbox", { name: "내 제작 요청", exact: true });
  await expect(request).toHaveValue(/앞서 작업한 my-first-web 폴더의 index.html/);
  await expect(request).toHaveValue(/직접 써본 도구 모음/);
  await request.fill("내가 직접 편집한 제작 요청. 기존 파일의 소개만 바꿔줘.");
  await page.getByRole("button", { name: "이전 설명", exact: true }).click();
  await goToPreviousLesson(page);
  await expect(page).toHaveURL(/\/lessons\/page-planning$/);
  await expect(progress).toHaveText(/5 \/ 5$/);
  await page.getByRole("button", { name: "이전 설명", exact: true }).click();
  await page.getByRole("button", { name: "이전 설명", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "첫 소개 문장", exact: true })).toHaveValue(
    "직접 써본 도구와 배운 점을 소개합니다.",
  );
  await page
    .getByRole("textbox", { name: "홈페이지 제목", exact: true })
    .fill("친구에게 추천하는 도구");
  await next.click();
  await next.click();
  await page.getByRole("button", { name: "제작 요청 다듬기로 →", exact: true }).click();
  await next.click();
  await expect(request).toHaveValue("내가 직접 편집한 제작 요청. 기존 파일의 소개만 바꿔줘.");
  await expect(page.getByRole("status").filter({ hasText: "기획이 바뀌었어요." })).toContainText(
    "기획이 바뀌었어요.",
  );
});
