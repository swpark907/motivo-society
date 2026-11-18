import { expect, test } from "./workbook-test";

test("1-6은 그림 세 칸→부탁과 승인→파일 열기→새로고침→안 될 때→정리로 이어진다", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/first-file");
  const next = page.getByRole("button", { name: /^다음으로/ });
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  const body = page.getByLabel("수업 내용", { exact: true });
  let screen = 1;
  await expect(progress).toHaveText("1 / 6");
  async function advance() {
    await next.click();
    screen += 1;
    await expect(progress).toHaveText(new RegExp(`^${screen} / 6$`));
  }
  // 짧은 설명 화면은 PC에서 본문과 이동 버튼이 한 화면에 보여야 한다.
  async function capture(name: string) {
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
    if (testInfo.project.name === "desktop") {
      await expect
        .poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight))
        .toBeLessThanOrEqual(2);
    }
  }

  // 1. 빈 폴더 → 파일 → 화면. 누를 것은 없다.
  await expect(page.getByRole("heading", { name: "오늘은 진짜 파일을 만들어요" })).toBeVisible();
  await expect(body).toContainText("비어 있어요");
  await expect(body).toContainText("브라우저에 화면이 나와요");
  await capture("1-intro");

  // 2. 메모에 받은 소개 글을 붙이면 조건 줄이 바뀌고, 파일이 만들어졌으면 도장을 찍는다.
  await advance();
  await expect(page.getByRole("heading", { name: "파일을 만들어 달라고 부탁해요" })).toBeVisible();
  const memo = page.getByRole("region", { name: "파일을 부탁하는 메모" });
  await expect(memo).toContainText("index.html 파일을 하나 만들어줘.");
  await expect(memo).toContainText("소개 글이 들어갈 자리만 비워 둬.");
  await page.getByLabel(/지난 수업에서 받은 소개 글/).fill("안녕하세요, 그림 그리는 회사원이에요.");
  await expect(memo).toContainText("이 글을 그대로 넣어줘: 안녕하세요, 그림 그리는 회사원이에요.");
  await expect(page.getByRole("region", { name: "승인을 물으면 볼 것" })).toContainText(
    "my-first-web",
  );
  await page.getByRole("button", { name: "파일이 만들어졌으면 눌러서 도장을 찍어요" }).click();
  await expect(page.getByRole("button", { name: "파일이 만들어졌어요" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await capture("2-ask");

  // 3. 폴더에서 파일을 열고 본 것을 적는다.
  await advance();
  await expect(page.getByRole("heading", { name: "만든 파일을 열어 봐요" })).toBeVisible();
  // Windows와 Mac의 순서가 같아서 운영체제를 고르지 않는다.
  await expect(page.getByRole("button", { name: "Mac", exact: true })).toHaveCount(0);
  await expect(body).toContainText("바탕 화면의 my-first-web 폴더를 두 번 눌러 열어요.");
  await expect(body).toContainText("file://");
  await page.getByLabel(/화면에 무엇이 보였는지/).fill("제목과 세 문장이 보였다");
  await page.getByRole("button", { name: "화면을 봤으면 눌러서 도장을 찍어요" }).click();
  await capture("3-open");

  // 4. 연습 창: 메모를 보내도 제목은 그대로이고, 새로고침을 눌러야 바뀐다.
  await advance();
  await expect(page.getByRole("heading", { name: "한 곳만 고치고 새로고침해요" })).toBeVisible();
  const browser = page.getByRole("region", { name: "연습용 브라우저 창" });
  const reload = browser.getByRole("button", { name: "새로고침" });
  // 메모를 보내기 전에 새로고침하면 아직 바뀐 게 없다고 알려 준다.
  await reload.click();
  await expect(body).toContainText("아직 파일이 바뀌지 않았어요.");
  await page.getByRole("button", { name: "메모 보내기 (연습)" }).click();
  await expect(browser).toContainText("내 소개");
  await expect(browser).toContainText("어? 제목이 그대로네");
  await expect(browser).not.toContainText("나를 소개합니다");
  await capture("4-refresh-stale");
  await reload.click();
  await expect(browser).toContainText("나를 소개합니다");
  await expect(body).toContainText("파일을 다시 읽어 오라");
  await page.getByLabel(/내 파일에서는 어디를 고쳐 볼까요/).fill("제목을 내 이름으로 바꿔줘.");
  await page.getByRole("button", { name: "고친 화면을 봤으면 눌러서 도장을 찍어요" }).click();
  await capture("4-refresh-done");

  // 5. 증상 카드를 누르면 확인할 것이 나온다.
  await advance();
  await expect(page.getByRole("heading", { name: "생각대로 안 될 때" })).toBeVisible();
  await capture("5-trouble-closed");
  for (const symptom of [
    "폴더에 파일이 안 보여요",
    "화면 대신 글자만 가득 나와요",
    "고쳤는데 화면이 그대로예요",
  ])
    await page.getByRole("button", { name: new RegExp(symptom) }).click();
  await expect(body).toContainText("연결 프로그램");
  await expect(body).toContainText("새로고침을 눌렀는지 봐요.");
  await capture("5-trouble-open");

  // 6. 정리와 다음 단원.
  await next.click();
  await expect(page.getByRole("heading", { name: "오늘 알게 된 것" })).toBeVisible();
  await expect(body).toContainText("고치고 나면 새로고침해야 바뀐 화면이 보여요.");
  await expect(body).toContainText("2단원");
  // 다른 수업을 마치지 않았으니 "1단원을 마쳤어요"라고 하지 않는다. 적은 것과 남은 일을 보여 준다.
  await expect(body).not.toContainText("1단원을 마쳤어요");
  await expect(body).toContainText("제목과 세 문장이 보였다");
  await expect(body).toContainText("제목을 내 이름으로 바꿔줘.");
  await expect(body).toContainText("준비 도장을 다 찍으면");
  await capture("6-recap");
  await page.getByRole("button", { name: /^학습 마치고 단원 지도로/ }).click();
  await expect(page.getByLabel("수업 내용", { exact: true })).toHaveCount(0);
});

test("1-6은 아무것도 누르지 않아도 끝까지 넘어간다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/first-file");
  const next = page.getByRole("button", { name: /^다음으로/ });
  await next.click();
  // 읽으면서 따라가는 사람에게는 내 파일 칸과 도장 대신 나중에 해 볼 순서를 알려 준다.
  await page.getByRole("button", { name: /읽으면서 따라갈게요/ }).click();
  await next.click();
  await expect(page.getByRole("button", { name: /화면을 봤으면/ })).toHaveCount(0);
  await expect(page.getByText(/컴퓨터가 준비되면 이 순서대로/)).toBeVisible();
  await next.click();
  await expect(page.getByLabel(/내 파일에서는 어디를 고쳐 볼까요/)).toHaveCount(0);
  for (let step = 0; step < 2; step++) await next.click();
  await expect(page.getByRole("heading", { name: "오늘 알게 된 것" })).toBeVisible();
  await page.getByRole("button", { name: /^학습 마치고 단원 지도로/ }).click();
  await expect(page.getByLabel("수업 내용", { exact: true })).toHaveCount(0);
});
