"use client";

// 2-3 무엇을 어떤 순서로: 담을 내용 고르기(지금 · 나중에) → 어떤 내용을 먼저(정보 구조) → 종이에 칸 그리기
// (와이어프레임) → 오늘 알게 된 것.
import { workbookProjectStep } from "@/lib/workbook-course";
import { layoutLabel } from "@/lib/workbook-plan-options";
import { planLines } from "@/lib/workbook-plan-readers";
import type { ProjectLessonProps } from "./WorkbookProjectLesson";
import { WorkbookPlanLessonFrame } from "./WorkbookPlanLessonFrame";
import { usePlanContext } from "./usePlanContext";
import { WorkbookPlanContent } from "./WorkbookPlanContent";
import { WorkbookPlanOrder } from "./WorkbookPlanOrder";
import { WorkbookPlanSketch } from "./WorkbookPlanSketch";
import { WorkbookPlanStepRecap } from "./WorkbookPlanStepRecap";

const LEARNED = [
  "지금 소개할 수 있는 내용만 넣고, 나머지는 나중에 채워요.",
  "가장 중요한 내용은 휴대폰 첫 화면 안에 들어오게 위쪽에 둬요.",
  "만들기 전에 칸만 그려 배치를 정하는 그림을 와이어프레임이라고 해요.",
] as const;

export function WorkbookStructureLesson({ onBack, onStep }: ProjectLessonProps) {
  const { record, reader, button, update } = usePlanContext();
  return (
    <WorkbookPlanLessonFrame
      point={workbookProjectStep.structure}
      onBack={onBack}
      onStep={onStep}
      goal={{
        title: "넣을 내용을 고르고 순서와 배치 정하기",
        text: "지난 수업에서 고른 읽을 사람과 레퍼런스를 떠올리며 골라요.",
        note: "정한 순서와 배치는 요청에 그대로 들어가요.",
      }}
      screens={[
        () => <WorkbookPlanContent record={record} reader={reader} update={update} />,
        () => <WorkbookPlanOrder record={record} reader={reader} button={button} update={update} />,
        () => <WorkbookPlanSketch record={record} update={update} />,
        () => (
          <WorkbookPlanStepRecap
            point={workbookProjectStep.structure}
            learned={LEARNED}
            decided={[
              ["지금 넣을 것", planLines(record.content).join(" → ")],
              ["나중에 채울 것", planLines(record.later).join(" · ")],
              ["배치", layoutLabel(record.layout) ?? ""],
            ]}
          />
        ),
      ]}
    />
  );
}
