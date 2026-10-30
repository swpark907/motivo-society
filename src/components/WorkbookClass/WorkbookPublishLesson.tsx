"use client";

import { workbookPlanExample } from "@/lib/workbook-page-plan";
import { WorkbookAddressLesson } from "./WorkbookAddressLesson";
import { WorkbookPreflightLesson } from "./WorkbookPreflightLesson";
import { WorkbookDebugLesson } from "./WorkbookDebugLesson";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import type { PublishRecord } from "@/lib/workbook-publish";
export { emptyPublish, type PublishRecord } from "@/lib/workbook-publish";

export type PublishLessonProps = {
  step: number;
  onStep: (step: number) => void;
  project: ProjectRecord;
  record: PublishRecord;
  onChange: (record: PublishRecord) => void;
  onBack: () => void;
  onComplete: () => void;
};

export function WorkbookPublishLesson(props: PublishLessonProps) {
  return props.step === 0 ? (
    <WorkbookPreflightLesson {...props} />
  ) : props.step === 1 ? (
    <WorkbookAddressLesson {...props} />
  ) : (
    <WorkbookDebugLesson
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
