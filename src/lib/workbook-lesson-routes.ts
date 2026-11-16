import { workbookCourse, workbookLessonId } from "./workbook-course";
export const workbookClassPath = "/workbook/classes/vibe-web";
export const workbookLessonRoutes = workbookCourse.flatMap((unit, world) =>
  unit.lessons.map((item, step) => ({
    slug: item.slug,
    world: unit.world,
    step,
    lesson: world === 0 ? step : workbookLessonId.aiCount + world - 1,
    path: `${workbookClassPath}/lessons/${item.slug}`,
  })),
);
