"use client";

// 2-2 남의 페이지에서 배우기: 예시 세 장 → 뜯어보기 → 가져올 것과 뺄 것 → 실제로 찾는 법 → 오늘 알게 된 것.
import { workbookProjectStep } from "@/lib/workbook-course";
import { planLines } from "@/lib/workbook-plan-readers";
import type { ProjectLessonProps } from "./WorkbookProjectLesson";
import { WorkbookPlanLessonFrame } from "./WorkbookPlanLessonFrame";
import { usePlanContext } from "./usePlanContext";
import {
  WorkbookRefAnatomy,
  WorkbookRefGallery,
  WorkbookRefPick,
  WorkbookRefSearch,
  takenReferences,
} from "./WorkbookRefScreens";
import { WorkbookPlanStepRecap } from "./WorkbookPlanStepRecap";

const LEARNED = [
  "기획은 빈 종이가 아니라 비슷한 페이지를 보는 데서 시작해요.",
  "페이지는 하는 일이 다른 부분들로 이루어져 있어요.",
  "가져올 것과 뺄 것은 읽을 사람과 목적에 맞는지로 골라요.",
  "구조와 순서만 참고하고, 남의 글 · 사진 · 로고는 쓰지 않아요.",
] as const;

export function WorkbookReferencesLesson({ onBack, onStep }: ProjectLessonProps) {
  const { record, picked, update } = usePlanContext();
  const dropped = planLines(record.references).filter((line) => line.startsWith("drop:")).length;
  return (
    <WorkbookPlanLessonFrame
      point={workbookProjectStep.references}
      onBack={onBack}
      onStep={onStep}
      goal={{
        title: "남의 페이지를 뜯어보고 가져올 것과 뺄 것 고르기",
        text: "예시는 칸으로 그린 연습용 페이지예요.",
        note: "내 레퍼런스는 검색하거나 AI에게 물어 찾아요.",
      }}
      screens={[
        () => <WorkbookRefGallery />,
        () => <WorkbookRefAnatomy />,
        () => <WorkbookRefPick record={record} update={update} />,
        () => <WorkbookRefSearch record={record} reader={picked} />,
        () => (
          <WorkbookPlanStepRecap
            point={workbookProjectStep.references}
            learned={LEARNED}
            decided={[
              ["가져올 것", takenReferences(record).join(" · ")],
              ["뺄 것", dropped ? `${dropped}가지` : ""],
            ]}
          />
        ),
      ]}
    />
  );
}
