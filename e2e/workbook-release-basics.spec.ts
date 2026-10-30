import { expect, test } from "./workbook-test";
import { getWorkbookCourseLesson } from "../src/lib/workbook-course";

test("공개 소개에 가상 후기·평점이 없고 짧은 실험 왕복이 학습 진도를 보존한다", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/workbook/classes/vibe-web");
  await expect(page.getByText("무료 공개 체험", { exact: true })).toBeVisible();
  await expect(page.getByText(/판매 준비 중/)).toHaveCount(0);
  await expect(
    page.getByText("기본 17수업과 선택 심화를 무료로 체험해요.", { exact: false }).first(),
  ).toBeVisible();
  await expect(page.getByText(/가상 평점|가상 후기|★★★★★|예시 수강평/)).toHaveCount(0);
  await expect(page.locator("#class-reviews")).toHaveCount(0);
  await page.getByRole("button", { name: "강의 시작하기 ↗", exact: true }).click();
  await page.getByRole("button", { name: "기초강의 시작하기 →", exact: true }).click();
  const next = page.getByRole("button", { name: "다음으로", exact: true });
  for (let i = 0; i < 3; i++) await next.click();
  await page.getByRole("button", { name: "예시 결과 보기", exact: true }).click();
  await page.getByRole("button", { name: "이미 1만 명이 선택했다는 내용", exact: true }).click();
  await next.click();
  await page.getByRole("button", { name: "학습 마치고 단원 지도로 →", exact: true }).click();
  await expect(page.getByText("1 / 5 학습 확인", { exact: true })).toBeVisible();
  const lesson = getWorkbookCourseLesson("agent", 4);
  await expect(
    page.getByRole("button", {
      name: new RegExp(`선택 심화.*${lesson.number} ${lesson.title} 수업을 마치면 열려요$`),
    }),
  ).toBeDisabled();
  await page.evaluate(() => {
    (window as unknown as { workbookNavigationMarker: string }).workbookNavigationMarker =
      "same-document";
  });
  await page.getByRole("button", { name: "메뉴 펼치기", exact: true }).click();
  await page.getByRole("link", { name: "짧은 실험 ↗", exact: true }).click();
  await expect(page).toHaveURL(/\/workbook#experiments$/);
  expect(
    await page.evaluate(
      () => (window as unknown as { workbookNavigationMarker?: string }).workbookNavigationMarker,
    ),
  ).toBe("same-document");
  await expect(page.getByRole("region", { name: "클래스 이어하기", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "클래스 이어가기 →", exact: true }).click();
  await expect(page.getByText("1 / 5 학습 확인", { exact: true })).toBeVisible();
});

test("공개 메뉴·작업실·댓글 문구가 실제 기능과 일치한다", async ({ page }) => {
  await page.goto("/workbook");
  const navigation = page.getByRole("navigation", { name: "Workbook 메뉴", exact: true });
  await expect(navigation.getByRole("link", { name: "워크북 홈 ↗", exact: true })).toHaveAttribute(
    "href",
    "/workbook",
  );
  await expect(
    navigation.getByRole("link", { name: "클래스 둘러보기 ↗", exact: true }),
  ).toHaveAttribute("href", "/workbook/classes");
  await expect(
    page.getByRole("link", { name: "휴대폰에서는 왜 잘릴까?", exact: true }),
  ).toHaveAttribute("href", "/workbook/journey");
  await page.getByRole("button", { name: /카피바라가 기다려요/ }).click();
  const room = page.getByRole("dialog", { name: "카피바라의 작업실", exact: true });
  await expect(room.getByRole("navigation", { name: "작업실 시안 선택", exact: true })).toHaveCount(
    0,
  );
  await expect(
    room.getByText(/이전 자유 배치|새 공간 시안|수집·배치 구조|레이어 시안/),
  ).toHaveCount(0);
  await expect(room.getByText("물건을 골라 작업실을 꾸며보세요.", { exact: true })).toBeVisible();
  await expect(room).toContainText("회원 계정·다른 기기와 동기화하지 않아요");
  await room.getByRole("button", { name: "작업실 닫기 ×", exact: true }).click();
  await page.goto("/workbook/reading/show-the-screen");
  const form = page.getByRole("form", { name: "테스트 댓글 작성", exact: true });
  await form.getByRole("textbox", { name: "이름", exact: true }).fill("   ");
  await form.getByRole("textbox", { name: "댓글", exact: true }).fill("   ");
  await form.getByRole("button", { name: "댓글 남기기 ↗", exact: true }).click();
  await expect(form.getByRole("status")).toHaveText("이름과 댓글 내용을 입력해주세요.");
  await form.getByRole("textbox", { name: "이름", exact: true }).fill("김 학습");
  await form
    .getByRole("textbox", { name: "댓글", exact: true })
    .fill("띄어쓰기를 포함한 생각입니다.");
  await form.getByRole("button", { name: "댓글 남기기 ↗", exact: true }).click();
  await expect(page.getByRole("list", { name: "이 글의 테스트 댓글", exact: true })).toContainText(
    "띄어쓰기를 포함한 생각입니다.",
  );
});

for (const view of ["summary", "application&stage=publish"]) {
  test(`미완료 상태의 ${view} 직접 링크는 남은 기본 학습과 올바른 지도를 안내한다`, async ({
    page,
  }) => {
    await page.goto("/workbook/classes/vibe-web?view=" + view);
    const remaining = page.getByRole("region", { name: "남은 기본 학습", exact: true });
    await expect(remaining).toBeVisible();
    await expect(remaining).toContainText("1-1 AI 이해하기");
    await expect(page.getByText(/앞선 학습 상태가 바뀌었어요/)).toHaveCount(0);
    await remaining
      .getByRole("button", { name: "1단원 AI 도구 준비하기 지도 보기 →", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "AI 도구 준비하기", exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveURL(/view=map$/);
  });
}
