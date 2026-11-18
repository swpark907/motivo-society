import { expect, test } from "./workbook-test";

test("1-5는 심부름 메모→네 가지→보내기→확인→다시 부탁→정리로 이어진다", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/workbook/classes/vibe-web/lessons/first-request");
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
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
    if (testInfo.project.name === "desktop") {
      await expect
        .poll(() => body.evaluate((element) => element.scrollHeight - element.clientHeight))
        .toBeLessThanOrEqual(2);
    }
  }

  // 1. 같은 심부름 메모에 다른 봉투가 세 번 돌아온다.
  await expect(
    page.getByRole("heading", { name: "AI에게 요청을 잘한다는 건 어떤 걸까요" }),
  ).toBeVisible();
  await expect(body).toContainText("점심 사다 줘");
  await page.getByRole("button", { name: "메모 건네기", exact: true }).click();
  await expect(body).toContainText("매운 짬뽕 곱빼기");
  const again = page.getByRole("button", { name: "같은 메모 한 번 더 건네기", exact: true });
  await again.click();
  await again.click();
  await expect(body).toContainText("김밥 열 줄");
  await expect(body).toContainText("짐작할 틈을 줄이는 일");
  await capture("1-errand");

  // 2. 이름표 네 개는 그대로이고 글만 AI에게 건넬 메모로 바뀐다.
  await advance();
  await expect(page.getByRole("heading", { name: "작업 메모에 적을 네 가지" })).toBeVisible();
  const memo = page.getByRole("region", { name: "작업 메모", exact: true });
  for (const tag of ["무엇을", "어디에 쓸지", "조건", "하지 말 것"])
    await expect(memo.getByText(tag, { exact: true })).toBeVisible();
  await expect(memo).toContainText("김밥 두 줄 사다 줘.");
  await capture("2-parts-errand");
  await memo.getByRole("button", { name: "AI에게", exact: true }).click();
  await expect(memo.getByRole("button", { name: "AI에게", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(memo).toContainText("나를 소개하는 글을 써줘.");
  await expect(memo.getByText("무엇을", { exact: true })).toBeVisible();
  await expect(body).toContainText("프롬프트");
  await capture("2-parts-ai");

  // 3. 한 줄만 내 이야기로 쓰고, 보냈으면 도장을 찍는다. 찍지 않아도 넘어갈 수 있다.
  await advance();
  await expect(page.getByRole("heading", { name: "직접 보내 볼까요" })).toBeVisible();
  await page.getByLabel("나를 한 줄로 소개하기").fill("나는 퇴근 후 그림을 그리는 회사원이야.");
  await expect(body).toContainText("파일은 만들지 말고 답으로만 보여줘.");
  await expect(body).toContainText("Enter");
  // 복사가 막힌 환경이면 붙여 넣을 글만 담긴 상자가 골라진 채로 나온다.
  await page.getByRole("button", { name: "메모 떼어 가기 (복사)" }).click();
  const copiedOk = page.getByText("복사했어요. 이제 Claude 앱으로 가요.");
  const fallback = page.getByRole("textbox", { name: /자동 복사가 안 됐어요/ });
  await expect(copiedOk.or(fallback)).toBeVisible();
  if (await fallback.isVisible()) {
    await expect(fallback).toHaveValue(
      /나를 소개하는 글을 써줘. 나는 퇴근 후 그림을 그리는 회사원이야./,
    );
    await expect(fallback).not.toHaveValue(/Claude Code는 파일도/);
  }
  await page.getByRole("button", { name: "보냈으면 눌러서 도장을 찍어요" }).click();
  await expect(page.getByRole("button", { name: "보냈어요" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await capture("3-send");

  // 4. 예시 답에서 메모와 다른 두 문장을 찾는다. 맞는 문장은 틀렸다고 하지 않는다.
  await advance();
  await expect(page.getByRole("heading", { name: "받은 답을 메모와 맞춰 봐요" })).toBeVisible();
  await expect(body).toContainText("네 문장이에요. 세 문장으로 부탁했는데!");
  await page
    .getByRole("button", { name: "안녕하세요, 커피와 산책을 좋아하는 직장인이에요." })
    .click();
  await expect(body).toContainText("이 문장은 메모와 맞아요.");
  await page.getByRole("button", { name: "5년 동안 마케팅 일을 하며 여러 상을 받았어요." }).click();
  await expect(body).toContainText("메모에 없던 경력이에요");
  await page.getByRole("button", { name: "귀하의 방문을 진심으로 환영하는 바입니다." }).click();
  await expect(body).toContainText("세 곳을 다 찾았어요.");
  // 직접 보낸 사람은 내 답을 같은 네 가지로 맞춰 본다.
  const mineChecks = page.getByRole("group", { name: "내 답도 이 네 가지로 맞춰 봐요" });
  await mineChecks.getByRole("checkbox", { name: /하지 말 것/ }).check();
  await expect(mineChecks.getByRole("checkbox", { name: /하지 말 것/ })).toBeChecked();
  await page.getByLabel(/내가 받은 답은 어땠는지/).fill("세 문장은 지켰는데 취미를 지어냈다");
  await capture("4-check");

  // 5. 잘된 문장에 '그대로 둘 것'을 붙이면 고쳐 달라는 메모에 한 줄이 더해진다.
  await advance();
  await expect(page.getByRole("heading", { name: "고칠 곳만 집어서 다시 부탁해요" })).toBeVisible();
  const followUp = page.getByRole("region", { name: "고쳐 달라는 메모", exact: true });
  await expect(followUp).toContainText("그대로 둘 문장이 아직 없어요.");
  await page
    .getByRole("button", { name: "안녕하세요, 커피와 산책을 좋아하는 직장인이에요." })
    .click();
  await page.getByRole("button", { name: "커피 한 잔 들고 천천히 걷는 시간을 좋아해요." }).click();
  await expect(followUp).toContainText("첫 번째, 세 번째 문장은 그대로 둬.");
  // 예시 메모는 복사하지 않는다. 직접 보낸 사람은 내 답에 맞게 두 칸을 쓰고 그 글을 복사한다.
  const mine = page.getByRole("region", { name: "내 답에 다시 부탁하기" });
  const copy = mine.getByRole("button", { name: "내 수정 요청 복사하기" });
  await expect(copy).toBeDisabled();
  await mine.getByLabel("바꿀 것").fill("둘째 문장의 취미 이야기는 빼줘.");
  await mine.getByLabel("그대로 둘 것").fill("나머지는 그대로 둬.");
  await expect(copy).toBeEnabled();
  await capture("5-again");

  // 6. 정리: 앞에서 쓴 것이 메모판에 붙는다.
  await next.click();
  await expect(page.getByRole("heading", { name: "오늘 알게 된 것" })).toBeVisible();
  await expect(body).toContainText("나는 퇴근 후 그림을 그리는 회사원이야.");
  await expect(body).toContainText("세 문장은 지켰는데 취미를 지어냈다");
  await expect(body).toContainText("둘째 문장의 취미 이야기는 빼줘.");
  await expect(body).toContainText("적어 둔 수정 요청");
  // 예시 메모의 문장은 내 기록으로 남지 않는다.
  await expect(body).not.toContainText("첫 번째, 세 번째 문장은 그대로 둬.");
  await expect(body).toContainText("1-6 첫 코드 만들기");
  await capture("6-recap");
  await expect(page.getByRole("button", { name: /^다음 수업 1-6 첫 코드 만들기/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "단원 지도로", exact: true })).toBeVisible();
});

test("1-5는 아무것도 쓰지 않아도 끝까지 넘어간다", async ({ page }) => {
  await page.goto("/workbook/classes/vibe-web/lessons/first-request");
  const next = page.getByRole("button", { name: /^다음으로/ });
  for (let step = 0; step < 4; step++) await next.click();
  // 보내지 않은 사람에게는 예시 메모만 있고, 복사 버튼 대신 한 줄 칸이 있다.
  await page
    .getByRole("button", { name: "안녕하세요, 커피와 산책을 좋아하는 직장인이에요." })
    .click();
  await expect(page.getByRole("button", { name: /복사/ })).toHaveCount(0);
  await expect(page.getByLabel(/나라면 뭐라고 다시 부탁할지/)).toBeVisible();
  await next.click();
  await expect(page.getByRole("heading", { name: "오늘 알게 된 것" })).toBeVisible();
  const body = page.getByLabel("수업 내용", { exact: true });
  await expect(body).not.toContainText("내가 쓴 메모");
  await expect(body).not.toContainText("적어 둔 수정 요청");
});
