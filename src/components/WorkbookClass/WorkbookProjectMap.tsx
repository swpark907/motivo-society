"use client";
import { getWorkbookCourseLesson } from "@/lib/workbook-course";
import { WorkbookMapLessonCard } from "./WorkbookMapLessonCard";
import { WorkbookUnitArrival } from "./WorkbookUnitArrival";
import { isPlanReady, projectStepsAvailable, projectStepsDone } from "@/lib/workbook-project-steps";

// 지도 지점은 기존 수업 단계로 바로 연결한다. 입력과 위치는 방문 context가 소유한다.
import Image from "next/image";
import { WorkbookPracticalPoint } from "./WorkbookPracticalPoint";
import { WorkbookMapTopics } from "./WorkbookMapTopics";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookMap.module.scss";

// 기획 네 수업 · 요청 · 확인. 건물(작업실 · 정류장 · 광장)에 세 수업, 그 사이 길목에 세 수업을 둔다(1-3과 같은 방식).
const stops = [
  { x: 24, y: 62, task: "누가, 어떤 상황에서 볼지 정하고 잘 됐다는 기준을 세워요." },
  { x: 35, y: 62, task: "비슷한 목적의 페이지를 뜯어보고 가져올 것과 뺄 것을 골라요." },
  { x: 36, y: 50, task: "넣을 내용을 고르고 순서를 정한 뒤, 칸을 그려 봐요." },
  { x: 50, y: 44, task: "제목 · 버튼 문구 · 분위기를 정하고 기획서 한 장으로 모아요." },
  { x: 64, y: 47, task: "기획서를 네 칸 메모로 옮겨 같은 index.html을 고쳐 달라고 해요." },
  { x: 78, y: 62, task: "고쳐진 페이지를 설계도와 기준으로 확인하고 한 곳씩 고쳐요." },
].map((stop, point) => ({
  ...stop,
  name: getWorkbookCourseLesson("project", point).title,
  number: getWorkbookCourseLesson("project", point).number,
}));
export function WorkbookProjectMap({
  onEnter,
  panelTarget,
  onPractical,
  arrived = false,
}: {
  onEnter: (step: number) => void;
  /** 1-6 정리에서 바로 넘어왔는지. 패널 맨 위에 1단원 마침을 알리고 첫 수업 시작에 포커스를 둔다. */
  arrived?: boolean;
  onPractical?: () => void;
  panelTarget?: HTMLElement | null;
}) {
  const { project, projectCompleted, projectStop } = useWorkbookProgress();
  const planReady = isPlanReady(project);
  const done = projectStepsDone(project, projectCompleted);
  const available = projectStepsAvailable(done);
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
  useEffect(() => {
    if (arrived) requestAnimationFrame(() => startButton.current?.focus());
  }, [arrived]);
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
              <polyline points="24,62 35,62" data-next={next === 1} />
              <polyline points="35,62 36,50" data-next={next === 2} />
              <polyline points="36,50 36,44 50,44" data-next={next === 3} />
              <polyline points="50,44 62,44 64,47" data-next={next === 4} />
              <polyline points="64,47 65,48 66,62 78,62" data-next={next === 5} />
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
                aria-label={`${stop.number} ${stop.name}${available[index] ? " 선택" : " · 앞 수업을 먼저 마쳐요"}`}
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
          {arrived && (
            <WorkbookUnitArrival
              finished={1}
              next="여기서부터는 1단원에서 만든 폴더와 파일을 내 페이지로 키워요."
            />
          )}
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
