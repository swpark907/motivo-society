import { workbookCourse } from "./workbook-course";
export const workbookClassPath = "/workbook/classes/vibe-web";
export const workbookLessonRoutes = workbookCourse.flatMap((unit, world) =>
  unit.lessons.map((item, step) => ({
    slug: item.slug,
    world: unit.world,
    step,
    lesson: world === 0 ? step : world + 4,
    path: `${workbookClassPath}/lessons/${item.slug}`,
  })),
);
