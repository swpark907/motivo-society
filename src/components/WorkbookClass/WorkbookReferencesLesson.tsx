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
} from "./WorkbookRefScreens";
import { WorkbookReferencesRecap, type RecapLine } from "./WorkbookPlanRecaps";

const LEARNED: readonly RecapLine[] = [
  {
    term: "기획은 비슷한 페이지를 보는 데서 시작해요",
    text: "같은 목적의 페이지를 여러 개 보고 좋은 점을 골라 와요. 이런 페이지를 레퍼런스라고 해요.",
  },
  {
    term: "페이지는 하는 일이 다른 부분들로 이루어져 있어요",
    text: "사진 · 한 줄 소개 · 목록 · 후기 · 버튼은 저마다 맡은 일이 있어요.",
  },
  {
    term: "가져올 것은 읽을 사람과 목적으로 골라요",
    text: "예쁜지보다, 내 페이지를 볼 사람에게 필요한지가 기준이에요.",
  },
  {
    term: "구조와 순서만 참고해요",
    text: "남의 글 · 사진 · 로고는 가져오지 않아요.",
  },
];

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
          <WorkbookReferencesRecap
            point={workbookProjectStep.references}
            lines={LEARNED}
            takenIds={planLines(record.references)
              .filter((line) => line.startsWith("take:"))
              .map((line) => line.slice(5))}
            dropped={dropped}
          />
        ),
      ]}
    />
  );
}
