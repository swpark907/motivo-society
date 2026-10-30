"use client";
import { getWorkbookCourseLesson } from "@/lib/workbook-course";
import { WorkbookMapLessonCard } from "./WorkbookMapLessonCard";

// 지도 지점은 기존 수업 단계로 바로 연결한다. 입력과 위치는 방문 context가 소유한다.
import Image from "next/image";
import { WorkbookPracticalPoint } from "./WorkbookPracticalPoint";
import { WorkbookMapTopics } from "./WorkbookMapTopics";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookMap.module.scss";

const stops = [
  { x: 24, y: 62, task: "읽을 사람·목적·제목·소개·내용을 적어요." },
  {
    x: 50,
    y: 44,

    task: "같은 기획으로 index.html 제작 요청을 고르고 다듬어요.",
  },
  {
    x: 78,
    y: 62,

    task: "제목·내용·버튼과 부탁한 파일을 확인하고 관찰을 기록해요.",
  },
].map((stop, point) => ({
  ...stop,
  name: getWorkbookCourseLesson("project", point).title,
  number: getWorkbookCourseLesson("project", point).number,
}));
export function WorkbookProjectMap({
  onEnter,
  panelTarget,
  onPractical,
}: {
  onEnter: (step: number) => void;
  onPractical?: () => void;
  panelTarget?: HTMLElement | null;
}) {
  const { project, projectCompleted, projectStop } = useWorkbookProgress();
  const planReady = [
    project.title,
    project.audience,
    project.purpose,
    project.intro,
    project.content,
  ].every((value) => value.trim());
  const requestReady = planReady && !!project.request.trim() && project.mode !== null;
  const done = [planReady, requestReady, projectCompleted];
  const available = [true, planReady, requestReady];
  const next = done.findIndex((value) => !value);
  const [selected, setSelected] = useState<number | null>(projectStop);
  const [practicalSelected, setPracticalSelected] = useWorkbookLessonState(
    "map-practical-project",
    false,
  );
  const pointButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const startButton = useRef<HTMLButtonElement>(null);
  const current = stops[projectStop];
  const selectedStep = selected !== null && available[selected] ? selected : projectStop;
  const renderPanel = (content: ReactNode) =>
    panelTarget ? createPortal(content, panelTarget) : content;
  return (
    <div className={styles.wrapper}>
      <div className={styles.mapViewport}>
        <div
          className={styles.map}
          role="region"
          tabIndex={0}
          aria-label="기획하고 첫 화면 만들기 지도"
        >
          <div className={styles.canvas}>
            <Image
              src="/images/workbook/journey/map.png"
              alt="호수와 절벽 사이 작업실·정류장·광장을 잇는 기획하고 첫 화면 만들기 마을"
              width={1536}
              height={1024}
              sizes="(min-width: 1024px) 75vw, 100vw"
            />
            <svg
              className={styles.routeGuide}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              data-motion={false}
            >
              <polyline points="24,62 35,62 36,44 50,44" data-next={next === 1} />
              <polyline points="50,44 62,44 65,48 66,62 78,62" data-next={next === 2} />
            </svg>
            <span
              className={styles.avatar}
              style={{ left: `${current.x}%`, top: `calc(${current.y}% - var(--space-4))` }}
              aria-hidden="true"
            />
            {onPractical && (
              <WorkbookPracticalPoint
                stage="project"
                available={planReady}
                selected={practicalSelected}
                onSelect={() => {
                  setSelected(3);
                  setPracticalSelected(true);
                }}

                onEnter={onPractical}
                panelTarget={panelTarget}
              />
            )}
            {stops.map((stop, index) => (
              <button
                key={stop.name}
                ref={(element) => {
                  pointButtons.current[index] = element;
                }}
                className={styles.point}
                data-next={next === index}
                aria-current={projectStop === index ? "step" : undefined}
                aria-label={`${stop.number} ${stop.name}${available[index] ? " 선택" : index === 1 ? " · 기획을 먼저 적어요" : " · 제작 요청과 복습·실습 방식을 먼저 골라요"}`}
                disabled={!available[index]}
                style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                onClick={() => {
                  setPracticalSelected(false);
                  setSelected(index);
                  requestAnimationFrame(() => startButton.current?.focus());
                }}
              >
                <span aria-hidden="true">{stop.number}</span>
                <strong>
                  {stop.name}
                  {done[index] && <small>학습 확인</small>}
                  {next === index && <em>다음 목표</em>}
                </strong>
              </button>
            ))}
          </div>
        </div>
      </div>
      {renderPanel(
        <div className={styles.mapPanel}>
          <WorkbookMapLessonCard
            completed={done[selectedStep]}
            hidden={selected === null || practicalSelected}
            title={stops[selectedStep].name}
            meta={`${stops[selectedStep].number} · ${done[selectedStep] ? "학습 확인" : selectedStep === next ? "다음 수업" : "선택한 수업"}`}
            description={stops[selectedStep].task}
            startRef={startButton}
            disabled={!available[selectedStep]}
            onStart={() => onEnter(selectedStep)}
          >
            <WorkbookMapTopics stage="project" point={selectedStep} />
          </WorkbookMapLessonCard>
        </div>,
      )}
    </div>
  );
}
