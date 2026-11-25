"use client";

import { workbookPlanExample } from "@/lib/workbook-page-plan";
import { workbookExperienceStep } from "@/lib/workbook-course";
import { WorkbookResponsiveLesson } from "./WorkbookResponsiveLesson";
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
  const S = workbookExperienceStep;
  return props.step === S.basics ? (
    <WorkbookResponsiveLesson {...props} />
  ) : props.step === S.observation ? (
    <WorkbookScreenObservationLesson {...props} />
  ) : props.step === S.improvement ? (
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
