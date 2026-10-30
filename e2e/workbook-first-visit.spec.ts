import { test, expect } from "./workbook-test";

test("첫 방문 소개부터 1단원 예시 학습 전체와 2단원 진입을 이어간다", async ({ page }, info) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (info.project.name === "desktop") await page.setViewportSize({ width: 1280, height: 800 });
  const button = (name: string) => page.getByRole("button", { name, exact: true });
  const next = () => button("다음으로").click();
  const shot = async (name: string) =>
    page.screenshot({ path: info.outputPath(name + ".png"), fullPage: true });
  async function mapNext(name: string) {
    await expect(page).toHaveURL(/view=map/);
    const mapImage = page.getByRole("img", {
      name: "찻집·장터·실습 쉼터·대화 서재·제작 공방의 다섯 장소를 하나의 길로 연결한 학습 마을",
      exact: true,
    });
    await expect(mapImage).toBeVisible();
    expect((await mapImage.boundingBox())!.width).toBeGreaterThan(300);
    await shot("map-before-" + name);
    const shortcut = page.getByRole("button", { name: new RegExp("^다음 수업 시작 · .*" + name) });
    await expect(shortcut).toBeVisible();
    if (info.project.name === "mobile") {
      const action = await shortcut.boundingBox();
      const map = await page
        .getByRole("region", { name: "카피바라의 AI 도구 준비하기 지도", exact: true })
        .boundingBox();
      expect(action!.y).toBeLessThan(map!.y);
    }
    await shortcut.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  }
  await page.goto("/workbook/classes/vibe-web");
  await expect(button("강의 시작하기 ↗")).toBeInViewport();
  await shot("01-introduction");
  await button("강의 시작하기 ↗").click();
  await expect(
    page.getByRole("heading", { name: "배우고 나면 이런 페이지를 만들 수 있어요", exact: true }),
  ).toBeVisible();
  await shot("02-examples");
  await button("기초강의 시작하기 →").click();
  await next();
  await next();
  await next();
  await button("예시 결과 보기").click();
  await button("이미 1만 명이 선택했다는 내용").click();
  await next();
  await button("학습 마치고 단원 지도로 →").click();
  const map = page.getByRole("region", { name: "카피바라의 AI 도구 준비하기 지도", exact: true });
  const controlsBefore = await button("전체 과정 보기").boundingBox();
  await map.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  const controlsAfter = await button("전체 과정 보기").boundingBox();
  expect(controlsAfter!.x).toBeCloseTo(controlsBefore!.x, 0);
  await expect(button("지도 도움말")).toBeVisible();
  await expect(button("AI 이해하기 다시 보기")).toBeVisible();
  await button("전체 과정 보기").click();
  await shot("03-overview");
  await button("전체 과정 닫기").click();
  await button("클래스 소개 보기").click();
  await button("학습으로 돌아가기 ↗").click();
  await mapNext("AI 종류와 도구 알아보기");
  for (let i = 0; i < 8; i++) await next();
  await button("파일 작업 기능과 연결된 폴더·권한을 확인해야 해요").click();
  await next();
  await button("이미지를 생성하고 저장하는 기능").click();
  await button("그럴 수 있어요").click();
  await button("학습 정리 보기").click();
  await button("학습 마치고 단원 지도로 →").click();
  await mapNext("도구 준비하기");
  for (let screen = 1; screen <= 9; screen++) {
    if (screen === 3) await button("모바일에서 복습하기").click();
    await next();
  }
  await button("작업 폴더 → 요청 → 파일 변경 → 실행·확인 → 수정 요청").click();
  await next();
  await button("학습 정리 보기").click();
  await button("학습 마치고 단원 지도로 →").click();
  await mapNext("AI와 첫 대화하기");
  await next();
  await button("예시로 복습하기").click();
  await next();
  await button("예시 요청 가져오기").click();
  await next();
  await button("미리 만든 결과 살펴보기").click();
  await page
    .getByRole("textbox", { name: "확인한 점 하나", exact: true })
    .fill("두 문장이지만 첫 문장이 길어요.");
  await next();
  await button("수정 예시 가져오기").click();
  await next();
  await button("미리 만든 수정 결과 보기").click();
  await next();
  await button("첫 문장은 짧게 바꾸고 장소의 특징은 유지해줘").click();
  await button("학습 정리 보기").click();
  await button("학습 마치고 단원 지도로 →").click();
  await mapNext("첫 파일 만들기");
  await next();
  await button("예시로 복습하기").click();
  await next();
  await button("예시 요청 가져오기").click();
  await next();
  await button("미리 만든 결과 살펴보기").click();
  await button("작업 보기").click();
  await next();
  await page
    .getByRole("textbox", { name: "확인한 점 하나", exact: true })
    .fill("예시 제목과 목록이 보이고 버튼이 목록으로 이동해요.");
  await next();
  await button("수정 예시 가져오기").click();
  await next();
  await button("미리 만든 수정 결과 보기").click();
  await button("수정된 작업 보기").click();
  await next();
  await button("바뀐 파일과 브라우저 화면·버튼을 직접 확인해요").click();
  await next();
  await button("학습 정리 보기").click();
  await shot("04-unit-recap");
  await button("1단원 마치고 다음 학습 보기 →").click();
  const handoff = page.getByRole("region", { name: "단원 학습 완료와 다음 학습", exact: true });
  await expect(handoff).toContainText("다음은 2단원 · 기획하고 첫 화면 만들기");
  await expect(button("첫 파일 만들기 다시 보기")).toBeVisible();
  await expect(button("첫 파일 만들기 수업 시작")).toHaveCount(0);
  await shot("05-unit-handoff");
  await button("2-1 홈페이지 기획하기 시작 →").click();
  await expect(page).toHaveURL(/page-planning$/);
  await shot("06-planning");
  await next();
  await button("단원 지도 보기").click();
  await button("전체 과정 보기").click();
  await shot("07-unit-two-overview");
  await button("전체 과정 닫기").click();
  await button("클래스 소개 보기").click();
  await button("학습으로 돌아가기 ↗").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("기획하고 첫 화면 만들기");
  await page.getByRole("button", { name: /^다음 수업 시작 · 2-1/ }).click();
  await expect(page.getByLabel("현재 학습 단계", { exact: true })).toHaveText("화면 2 / 5");
});
