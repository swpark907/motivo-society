import { expect, test } from "./workbook-test";

// 새 상호작용은 복습용 표시 상태다. 새 필수 과제나 실제 제작 판정이 되지 않아야 한다.
test("1-1 메모와 결과를 연결하고 다음 화면 왕복에도 설명 위치가 남는다", async ({ page }, info) => {
  await page.goto("/workbook/classes/vibe-web/lessons/ai-understanding");
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  const result = page.getByRole("region", { name: "메모로 만든 소개문", exact: true });
  await expect(next).toBeEnabled();
  await expect(result).not.toContainText("창가 자리가 있어");
  await page.getByRole("button", { name: "소개 문장으로 정리해보기", exact: true }).press("Enter");
  await expect(result).toContainText("창가 자리가 있어");
  const connect = page.getByRole("button", { name: "메모와 문장 연결하기", exact: true });
  await connect.press("Enter");
  await expect(page.getByRole("button", { name: "창가 자리", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "전체 설명 보기", exact: true })).toHaveCount(0);
  const weekend = page.getByRole("button", { name: "주말 혼잡", exact: true });
  await weekend.press("Enter");
  await expect(weekend).toHaveAttribute("aria-pressed", "true");
  await expect(result.locator("mark")).toHaveText(
    "주말에는 사람이 많으니 방문 시간을 참고해주세요.",
  );
  await expect(page.getByRole("status")).toContainText("방문할 때 참고할 정보");
  await page.screenshot({ path: info.outputPath("ai-opening-connected.png") });
  await next.click();
  await page.getByRole("button", { name: "이전 설명", exact: true }).click();
  await expect(weekend).toHaveAttribute("aria-pressed", "true");
  await expect(result.locator("mark")).toHaveCount(1);
});

test("1-4 조건을 더하고 빼면 준비된 답변이 바뀌고 직접 쓴 요청은 보존된다", async ({
  page,
}, info) => {
  await page.goto("/workbook/classes/vibe-web/lessons/first-request");
  const request = page.getByRole("region", { name: "쌓이는 요청문", exact: true });
  const result = page.getByRole("region", { name: "조건별 답변 예시", exact: true });
  await page.getByRole("button", { name: "읽을 사람 알려주기", exact: true }).press("Enter");
  await expect(request).toContainText("장소 소개문을 써줘");
  await expect(request).toContainText("혼자 책 읽을 곳");
  await expect(result).toContainText("혼자 책 읽을 장소를 찾는 분께");
  await page.getByRole("button", { name: "장소 정보 알려주기", exact: true }).press("Enter");
  await expect(result).toContainText("머무를 장소를 고를 때 참고해보세요.");
  await page.getByRole("button", { name: "길이와 범위 정하기", exact: true }).press("Enter");
  await expect(result).not.toContainText("머무를 장소를 고를 때 참고해보세요.");
  await expect(request).toContainText("혼자 책 읽을 곳");
  await expect(request).toContainText("두 문장으로");
  await expect(page.getByRole("button", { name: "전체 예시 보기", exact: true })).toHaveCount(0);
  await expect(page.getByRole("status")).toBeFocused();
  if (info.project.name === "desktop") {
    await expect
      .poll(() =>
        page
          .getByLabel("수업 내용", { exact: true })
          .evaluate((el) => el.scrollHeight - el.clientHeight),
      )
      .toBeLessThanOrEqual(2);
  }
  await page.screenshot({ path: info.outputPath("prompt-built.png") });
  await page.getByRole("button", { name: "조건 하나 빼보기", exact: true }).click();
  await expect(request).not.toContainText("두 문장으로");
  await page.getByRole("button", { name: "전체 예시 보기", exact: true }).click();
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  await next.click();
  await page.getByRole("button", { name: "예시로 복습하기", exact: true }).click();
  await next.click();
  const own = page.getByRole("textbox", { name: "첫 요청", exact: true });
  await own.fill("내가 직접 쓴 장소 소개 요청. 이 문장은 보존해주세요.");
  const previous = page.getByRole("button", { name: "이전 설명", exact: true });
  await previous.click();
  await previous.click();
  await page.getByRole("button", { name: "처음부터 비교하기", exact: true }).click();
  await next.click();
  await next.click();
  await expect(own).toHaveValue("내가 직접 쓴 장소 소개 요청. 이 문장은 보존해주세요.");
});

test("전체 펼침 바로가기와 되돌리기는 포커스를 잇고 수업 진행을 요구하지 않는다", async ({
  page,
}) => {
  await page.goto("/workbook/classes/vibe-web/lessons/ai-understanding");
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  await expect(next).toBeEnabled();
  await page.getByRole("button", { name: "전체 설명 보기", exact: true }).press("Enter");
  await expect(page.getByRole("button", { name: "창가 자리", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "문장만 다시 보기", exact: true }).press("Space");
  await expect(
    page.getByRole("button", { name: "메모와 문장 연결하기", exact: true }),
  ).toBeFocused();
  await expect(next).toBeEnabled();
  await page.goto("/workbook/classes/vibe-web/lessons/first-request");
  await page.getByRole("button", { name: "전체 예시 보기", exact: true }).press("Enter");
  await expect(page.getByRole("status")).toBeFocused();
  await page.getByRole("button", { name: "처음부터 비교하기", exact: true }).press("Space");
  await expect(page.getByRole("button", { name: "읽을 사람 알려주기", exact: true })).toBeFocused();
  await expect(next).toBeEnabled();
  await page.getByRole("button", { name: "읽을 사람 알려주기", exact: true }).press("Enter");
  await page.getByRole("button", { name: "조건 하나 빼보기", exact: true }).press("Space");
  await expect(page.getByRole("button", { name: "읽을 사람 알려주기", exact: true })).toBeFocused();
});
