import { workbookCourse } from "./workbook-course";
import { ASK_INTRO, findPlanButton, planLines } from "./workbook-plan-readers";
import type { PlanForMemo } from "./workbook-plan-memo";

// 2-3 첫 화면 확인하기가 쓰는 대조 조각과 "한 곳만 고쳐 달라"는 요청 문장.
// 조사(은/는·이/가)를 붙이지 않는 문장으로 써서 어떤 기획이 들어와도 맞게 읽힌다.

export type PieceId = "title" | "intro" | "order" | "button";
export type ResultPiece = { id: PieceId; label: string; plan: string };

export function resultPieces(plan: PlanForMemo): ResultPiece[] {
  const now = planLines(plan.content);
  const intro = plan.intro.trim();
  return [
    { id: "title", label: "제목", plan: plan.title.trim() || "(제목)" },
    {
      id: "intro",
      label: "소개 글",
      plan: intro && intro !== ASK_INTRO ? intro : "AI가 물어보고 함께 채운 소개 글",
    },
    { id: "order", label: "넣을 내용 순서", plan: now.length ? now.join(" → ") : "(넣을 내용)" },
    {
      id: "button",
      label: "맨 아래 버튼",
      plan:
        plan.buttonLabel?.trim() ||
        findPlanButton(plan.purpose)?.label ||
        plan.purpose.trim() ||
        "(버튼)",
    },
  ];
}

/** 연습 화면에서 일부러 다르게 그린 조각. 내용이 둘 이상이면 순서를, 아니면 버튼을 뺀다. */
export function practiceDifference(plan: PlanForMemo): PieceId {
  return planLines(plan.content).length >= 2 ? "order" : "button";
}

/** "바꿀 것 / 그대로 둘 것" 요청 한 장. */
export function fixRequest(plan: PlanForMemo, piece: PieceId) {
  const now = planLines(plan.content);
  const button =
    plan.buttonLabel?.trim() || findPlanButton(plan.purpose)?.label || plan.purpose.trim();
  const change: Record<PieceId, string> = {
    title: `제목이 설계도와 달라. 제목을 “${plan.title.trim()}”로 바꿔줘.`,
    intro: "소개 글이 내가 답한 내용과 달라. 소개 글만 나에게 다시 물어보고 고쳐줘.",
    order: `내용 순서가 설계도와 달라. 위에서부터 ${now.join(", ")} 순서로 바꿔줘.`,
    button: `맨 아래 ‘${button}’ 버튼이 안 보여. 페이지 맨 아래에 이 버튼을 넣어줘.`,
  };
  return {
    change: change[piece],
    keep: "나머지 제목 · 소개 글 · 내용은 그대로 두고, my-first-web의 index.html만 고쳐줘.",
  };
}

/** 2단원 다음 단원(정리 화면의 다음 단원 표와 지도 도착에 쓴다). */
export const nextUnitAfterProject = workbookCourse[2];
