"use client";

import { WorkbookStorageLesson } from "./WorkbookStorageLesson";
import { WorkbookInteractionLesson } from "./WorkbookInteractionLesson";
import { WorkbookSharedDataLesson } from "./WorkbookSharedDataLesson";
import type { ProjectRecord } from "./WorkbookProjectLesson";
import type { DataRecord } from "@/lib/workbook-data";
export { emptyData, type DataRecord } from "@/lib/workbook-data";

export type DataLessonProps = {
  step: number;
  onStep: (step: number) => void;
  project: ProjectRecord;
  record: DataRecord;
  onChange: (record: DataRecord) => void;
  onBack: () => void;
  onComplete: () => void;
};

export function WorkbookDataLesson(props: DataLessonProps) {
  return props.step === 0 ? (
    <WorkbookInteractionLesson {...props} />
  ) : props.step === 1 ? (
    <WorkbookStorageLesson {...props} />
  ) : (
    <WorkbookSharedDataLesson {...props} />
  );
}
