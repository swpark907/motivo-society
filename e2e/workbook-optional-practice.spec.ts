import { expect, test } from "./workbook-test";

test("3단원의 자기 파일 확인 도움말은 기본 비교 학습의 필수가 아니다", async ({ page }) => {
  await page.goto("/demo/workbook-completion");
  await page
    .getByRole("button", { name: "3단원 수업 확인 · 독립 테스트 기록", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("두 화면에서 문제 찾기");
  await expect(page.getByLabel("개선 또는 유지 이유", { exact: true })).toHaveCount(0);
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  const help = page.getByText("연습 화면의 폭과 내 파일 확인 방법", { exact: true });
  expect(await help.evaluate((el) => el.parentElement!.hasAttribute("open"))).toBe(false);
  await help.click();
  await expect(next).toBeEnabled();
  await help.click();
  await next.click();
  for (const size of ["PC 폭 560px", "모바일 폭 280px"]) {
    await page.getByRole("button", { name: new RegExp("^" + size) }).click();
    await page.getByRole("button", { name: "이 화면 확인했어요", exact: true }).click();
  }
  await next.click();
  await page
    .getByRole("textbox", { name: "예시의 작은 화면에서 불편한 한 가지", exact: true })
    .fill("모바일에서 목록 오른쪽이 잘려요.");
  await next.click();
  await expect(page.getByRole("button", { name: "개선 요청 쓰기로 →", exact: true })).toBeEnabled();
});

test("4단원은 상세 보기 선택 실습 없이 입력 실험을 마치고 저장 수업으로 이어진다", async ({
  page,
}) => {
  await page.goto("/demo/workbook-completion");
  await page
    .getByRole("button", { name: "4단원 수업 확인 · 독립 테스트 기록", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("입력과 화면 변화");
  await expect(page.getByLabel("상세 보기 적용 또는 생략 이유", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("저장 적용 또는 생략 이유", { exact: true })).toHaveCount(0);
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  await next.click();
  await page
    .getByRole("button", { name: "화면에 표시하기 버튼을 눌러야 나타나요", exact: true })
    .click();
  await next.click();
  await page
    .getByRole("textbox", { name: "예시에 표시할 한 줄", exact: true })
    .fill("예시로 확인한 메모");
  await page.getByRole("button", { name: "화면에 표시하기", exact: true }).click();
  await next.click();
  const optional = page.getByText("선택 · 항목을 고르면 화면은 어떻게 바뀔까요?", { exact: true });
  expect(await optional.evaluate((el) => el.parentElement!.hasAttribute("open"))).toBe(false);
  await optional.click();
  await page
    .getByRole("button", { name: "소개 페이지 · 예시 상세 보기", exact: true })
    .press("Enter");
  await page.getByRole("button", { name: "예시 상세 닫기", exact: true }).press("Enter");
  await expect(
    page.getByRole("button", { name: "소개 페이지 · 예시 상세 보기", exact: true }),
  ).toBeFocused();
  await optional.click();
  await expect(next).toBeEnabled();
  await next.click();
  await page.getByRole("button", { name: "새로고침과 저장으로 →", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("새로고침과 저장");
});
