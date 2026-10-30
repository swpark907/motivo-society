"use client";

import { workbookPlanExample } from "@/lib/workbook-page-plan";
import { WorkbookImprovementRequestLesson } from "./WorkbookImprovementRequestLesson";
import { WorkbookScreenObservationLesson } from "./WorkbookScreenObservationLesson";
import { WorkbookScreenComparisonLesson } from "./WorkbookScreenComparisonLesson";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import type { ExperienceRecord } from "@/lib/workbook-experience";
export { emptyExperience, type ExperienceRecord } from "@/lib/workbook-experience";

export type ExperienceLessonProps = {
  project: ProjectRecord;
  record: ExperienceRecord;
  onChange: (record: ExperienceRecord) => void;
  onBack: () => void;
  onComplete: () => void;
  step: number;
  onStep: (step: number) => void;
};

export function WorkbookExperienceLesson(props: ExperienceLessonProps) {
  return props.step === 0 ? (
    <WorkbookScreenObservationLesson {...props} />
  ) : props.step === 1 ? (
    <WorkbookImprovementRequestLesson {...props} />
  ) : (
    <WorkbookScreenComparisonLesson
      {...props}
      project={
        [props.project.title, props.project.intro, props.project.content].every((value) =>
          value.trim(),
        )
          ? props.project
          : { ...props.project, ...workbookPlanExample }
      }
    />
  );
}
