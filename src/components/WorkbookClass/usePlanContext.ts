"use client";

// 기획 네 수업이 같이 쓰는 것: 기획 기록, 고른 읽을 사람(기록의 "읽을 사람" 칸에서 되찾는다),
// 1-6에서 붙여 넣은 소개 글, 고른 맨 아래 버튼, 기획을 고치는 함수.
import { findPlanButton, planReaders } from "@/lib/workbook-plan-readers";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import { usePlanUpdate } from "./WorkbookPlanLessonFrame";
import { FIRST_INTRO_NOTE } from "./WorkbookFileAsk";

export function usePlanContext() {
  const p = useWorkbookProgress();
  const record = p.project;
  const picked = planReaders.find((reader) => reader.audience === record.audience) ?? null;
  // 앞 화면을 건너뛰어도 뒤 화면이 비지 않게, 처음 고른 목적 → 첫 사람 순으로 대신 쓴다.
  const reader = picked ?? planReaders.find((item) => item.id === p.purpose) ?? planReaders[0];
  return {
    record,
    picked,
    reader,
    purposeId: p.purpose,
    firstIntro: p.projectWorkflow.notes[FIRST_INTRO_NOTE]?.text ?? "",
    button: findPlanButton(record.purpose),
    update: usePlanUpdate(),
  };
}
