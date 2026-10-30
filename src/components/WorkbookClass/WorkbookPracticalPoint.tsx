"use client";

// 각 지도 안의 선택 곁길과 공통 학습 패널을 연결한다. 기본 경로의 위치/완료는 변경하지 않는다.
import { getWorkbookUnit } from "@/lib/workbook-course";
import { WorkbookMapLessonCard } from "./WorkbookMapLessonCard";
import { useRef } from "react";
import { createPortal } from "react-dom";
import {
  practicalLabs,
  practicalMapStops,
  type PracticalStage,
} from "@/lib/workbook-practical-labs";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import styles from "./WorkbookMap.module.scss";

export function WorkbookPracticalPoint({
  stage,
  available,
  selected,
  onSelect,
  onEnter,
  panelTarget,
}: {
  stage: PracticalStage;
  available: boolean;
  selected: boolean;
  onSelect: () => void;
  onEnter: () => void;
  panelTarget?: HTMLElement | null;
}) {
  const stop = practicalMapStops[stage];
  const lab = practicalLabs[stage];
  const start = useRef<HTMLButtonElement>(null);
  const point = useRef<HTMLButtonElement>(null);
  const [state] = useWorkbookLessonState<{ current: number; answers: Record<number, number> }>(
    `practical-${stage}`,
    { current: 0, answers: {} },
  );
  const tried = lab.situations.filter((_, index) => state.answers[index] !== undefined).length;
  const panel = (
    <WorkbookMapLessonCard
      title={getWorkbookUnit(stage).optionalTitle}
      meta={`${getWorkbookUnit(stage).number}단원 선택 심화 · 기본 수업과 별도`}
      label="선택한 심화 장소"
      description="기본 수업 완료 조건에 포함되지 않는 선택 과정이에요."
      hidden={!selected || !available}
      startRef={start}
      onStart={onEnter}
    >
      <p>{lab.intro}</p>
      <small>{tried} / 3 상황 살펴봄 · 기본 학습 완료와 별도로 표시해요.</small>
    </WorkbookMapLessonCard>
  );
  return (
    <>
      <svg
        className={styles.routeGuide}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        data-motion={false}
      >
        <polyline points={stop.path} data-branch="true" />
      </svg>
      <button
        ref={point}
        className={styles.point}
        data-practical="true"
        data-label-align={stop.labelAlign}
        aria-pressed={selected}
        style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
        disabled={!available}
        aria-label={`${getWorkbookUnit(stage).number}단원 선택 심화 ${getWorkbookUnit(stage).optionalTitle}${available ? " 선택" : ` · ${stop.requires}`}`}
        onClick={() => {
          onSelect();
          requestAnimationFrame(() => start.current?.focus());
        }}
      >
        <span aria-hidden="true">심화</span>
        <strong>
          {getWorkbookUnit(stage).optionalTitle}
          <em>선택</em>
        </strong>
      </button>
      {panelTarget && createPortal(panel, panelTarget)}
    </>
  );
}
