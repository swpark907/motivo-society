"use client";

// 3-1 반응형 화면이란 무엇인가: 휴대폰으로 열어 보면(카피바라 장면) → 기기 다섯 개 → 크기에 맞춰 다시 놓이는
// 페이지(손잡이) → 좁아지면 무엇이 바뀌나 → 내 페이지는 어디서 볼까(2-1 방문자 카드) → 줄자 정리.
// 기획과 화면 흐름은 docs/product/workbook-unit-3-plan.md.
import { workbookExperienceStep } from "@/lib/workbook-course";
import type { ExperienceLessonProps } from "./WorkbookExperienceLesson";
import { WorkbookExperienceLessonFrame } from "./WorkbookExperienceLessonFrame";
import { WorkbookPhoneShrink } from "./WorkbookPhoneShrink";
import { WorkbookDeviceShelf } from "./WorkbookDeviceShelf";
import { WorkbookResizeWindow } from "./WorkbookResizeWindow";
import { WorkbookShrinkChanges } from "./WorkbookShrinkChanges";
import { WorkbookWhereSeen } from "./WorkbookWhereSeen";
import { WorkbookResponsiveRecap } from "./WorkbookResponsiveRecap";

export function WorkbookResponsiveLesson({
  project,
  record,
  onChange,
  onBack,
  onStep,
}: ExperienceLessonProps) {
  return (
    <WorkbookExperienceLessonFrame
      point={workbookExperienceStep.basics}
      record={record}
      onChange={onChange}
      onBack={onBack}
      onStep={onStep}
      goal={{
        title: "같은 페이지가 기기마다 어떻게 놓이는지 알기",
        text: "휴대폰부터 큰 모니터까지, 화면 크기가 다른 기기에서 내 페이지가 어떻게 보이는지 봐요.",
        note: "다음 수업에서는 내 페이지를 직접 휴대폰 크기로 열어 봐요.",
      }}
      screens={[
        () => <WorkbookPhoneShrink project={project} />,
        () => <WorkbookDeviceShelf project={project} />,
        () => <WorkbookResizeWindow project={project} />,
        () => <WorkbookShrinkChanges project={project} />,
        () => <WorkbookWhereSeen project={project} />,
        () => <WorkbookResponsiveRecap point={workbookExperienceStep.basics} />,
      ]}
    />
  );
}
