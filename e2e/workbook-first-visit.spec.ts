import { test, expect } from "./workbook-test";
import { workbookCourse } from "../src/lib/workbook-course";

const [unitOne, unitTwo] = workbookCourse;

test("첫 방문 소개부터 1단원 예시 학습 전체와 2단원 진입을 이어간다", async ({ page }, info) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (info.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 800 });
  const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: typeof name === "string" });
  const next = () => button(/^다음으로/).click();
  const progress = page.getByLabel("현재 학습 단계", { exact: true });
  const shot = async (name: string) =>
    page.screenshot({ path: info.outputPath(name + ".png"), fullPage: true });
  const mapRegion = (title: string) =>
    page.getByRole("region", { name: `카피바라의 ${title} 지도`, exact: true });
  const mapImage = page.getByRole("img", {
    name: "찻집·장터·실습 쉼터·대화 서재·제작 공방의 다섯 장소를 하나의 길로 연결한 학습 마을",
    exact: true,
  });
  // 수업 하나를 표지 다음 첫 화면부터 정리 화면까지 넘긴다. 진행 표시는 "n / m".
  async function walkLesson(title: string) {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(progress).toHaveText(/^1 \/ \d+$/);
    const total = Number((await progress.textContent())!.split("/")[1].trim());
    for (let screen = 2; screen <= total; screen++) {
      await next();
      await expect(progress).toHaveText(`${screen} / ${total}`);
    }
  }
  // 지도에서 다음 장소를 골라 학습 패널의 "수업 시작"으로 들어간다.
  async function mapNext(lesson: { number: string; title: string }) {
    await expect(page).toHaveURL(/view=map$/);
    await expect(mapImage).toBeVisible();
    expect((await mapImage.boundingBox())!.width).toBeGreaterThan(300);
    await shot("map-before-" + lesson.number);
    await mapRegion(unitOne.title)
      .getByRole("button", { name: new RegExp(`^${lesson.number} ${lesson.title}`) })
      .click();
    await button(`${lesson.title} 수업 시작`).click();
    await walkLesson(lesson.title);
  }

  // 클래스 소개 → 1단원 지도 → 1-0 클래스 인트로(네 장면) → 1-1
  await page.goto("/workbook/classes/vibe-web");
  await expect(button("강의 시작하기 ↗")).toBeInViewport();
  await shot("01-introduction");
  await button("강의 시작하기 ↗").click();
  await expect(page).toHaveURL(/view=map$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(unitOne.title);
  await expect(page.getByRole("heading", { name: "클래스 인트로", exact: true })).toBeVisible();
  await button("클래스 인트로 인트로 보기").click();
  await expect(page).toHaveURL(/view=intro$/);
  await shot("02-class-intro");
  await button("웹으로 뭘 만들 수 있을까요? →").click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "웹사이트로, 어디까지 만들 수 있을까요?",
      exact: true,
    }),
  ).toBeVisible();
  await next();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "하나의 프로젝트를 함께 만들어가는 여정.",
      exact: true,
    }),
  ).toBeVisible();
  await next();
  await expect(
    page.getByRole("heading", { level: 1, name: "준비하고, 함께 시작해볼까요?", exact: true }),
  ).toBeVisible();
  await button("첫 수업 시작 →").click();
  await expect(page).toHaveURL(new RegExp(`/lessons/${unitOne.lessons[0].slug}$`));
  await walkLesson(unitOne.lessons[0].title);
  await button("단원 지도로").click();

  // 지도 조작: 가로로 밀어도 상단 버튼은 그대로, 전체 과정 · 클래스 소개 왕복
  const map = mapRegion(unitOne.title);
  const controlsBefore = await button("전체 과정 보기").boundingBox();
  await map.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  const controlsAfter = await button("전체 과정 보기").boundingBox();
  expect(controlsAfter!.x).toBeCloseTo(controlsBefore!.x, 0);
  await expect(button(`${unitOne.lessons[0].title} 다시 보기`)).toBeVisible();
  await button("전체 과정 보기").click();
  await shot("03-overview");
  await button("전체 과정 닫기").click();
  await button("클래스 소개 보기").click();
  await button("학습으로 돌아가기 ↗").click();
  await expect(page).toHaveURL(/view=map$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(unitOne.title);

  // 1-2 ~ 1-5: 지도에서 들어가 정리 화면까지, 정리에서 단원 지도로 돌아온다.
  for (const lesson of unitOne.lessons.slice(1, -1)) {
    await mapNext(lesson);
    await button("단원 지도로").click();
  }

  // 1-6: 정리 화면의 주 버튼이 2단원 시작이다.
  await mapNext(unitOne.lessons[5]);
  await expect(page.getByRole("complementary", { name: unitTwo.title })).toContainText(
    "1단원을 마쳤어요",
  );
  await shot("04-unit-recap");
  await button(`${unitTwo.number}단원 시작하기 →`).click();

  // 2단원 지도 도착: 마침 줄, 첫 수업 시작 버튼에 포커스, 전체 과정에서 2단원이 열려 있다.
  await expect(page).toHaveURL(/view=map$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(unitTwo.title);
  await expect(page.getByText("1단원을 마쳤어요.")).toBeVisible();
  const start = button(`${unitTwo.lessons[0].title} 수업 시작`);
  await expect(start).toBeFocused();
  await shot("05-unit-handoff");
  await button("전체 과정 보기").click();
  await expect(button(`${unitTwo.title} 지도로`)).toBeEnabled();
  await shot("06-unit-two-overview");
  await button("전체 과정 닫기").click();
  await start.click();
  await expect(page).toHaveURL(new RegExp(`/lessons/${unitTwo.lessons[0].slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(unitTwo.lessons[0].title);
  await expect(progress).toHaveText(/^1 \/ \d+$/);
  await page.getByRole("button", { name: /^채용 담당자/ }).click();
  await next();
  await expect(progress).toHaveText(/^2 \/ \d+$/);
  await shot("07-planning");
});
