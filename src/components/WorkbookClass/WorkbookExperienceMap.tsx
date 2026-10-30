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
import { experienceProgress } from "@/lib/workbook-experience";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookMap.module.scss";

const stops = [
  {
    x: 20,
    y: 26,

    task: "휴대폰·넓은 화면을 보고 불편한 한 가지를 적어요.",
  },
  {
    x: 32,
    y: 73,

    task: "관찰한 문제를 한 부분만 고치는 요청으로 바꿔요.",
  },
  {
    x: 80,
    y: 46,

    task: "두 크기의 수정 결과와 같은 버튼을 다시 확인해요.",
  },
].map((stop, point) => ({
  ...stop,
  name: getWorkbookCourseLesson("experience", point).title,
  number: getWorkbookCourseLesson("experience", point).number,
}));
export function WorkbookExperienceMap({
  onEnter,
  panelTarget,
  onPractical,
}: {
  onEnter: (step: number) => void;
  onPractical?: () => void;
  panelTarget?: HTMLElement | null;
}) {
  const { experience, experienceCompleted, experienceStop } = useWorkbookProgress();
  const progress = experienceProgress(experience);
  const done = [progress.observed, progress.requested, experienceCompleted];
  const available = progress.available;
  const next = done.findIndex((value) => !value);
  const [selected, setSelected] = useState<number | null>(experienceStop);
  const [practicalSelected, setPracticalSelected] = useWorkbookLessonState(
    "map-practical-experience",
    false,
  );
  const pointButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const startButton = useRef<HTMLButtonElement>(null);
  const current = stops[experienceStop];
  const selectedStep = selected !== null && available[selected] ? selected : experienceStop;
  const renderPanel = (content: ReactNode) =>
    panelTarget ? createPortal(content, panelTarget) : content;
  return (
    <div className={styles.wrapper}>
      <div className={styles.mapViewport}>
        <div className={styles.map} role="region" tabIndex={0} aria-label="반응형 화면 만들기 지도">
          <div className={styles.canvas}>
            <Image
              src="/images/workbook/journey/experience-river-garden-v1.png"
              alt="강과 돌다리·정원 사이 관찰 정자·개선 공방·비교 마당을 잇는 화면 마을"
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
              <polyline
                points="20,26 20,33 27,39 24,44 28,52 39,58 42,63 38,68 32,73"
                data-next={next === 1}
              />
              <polyline
                points="32,73 42,68 42,60 47,55 53,51 60,51 66,50 71,48 80,46"
                data-next={next === 2}
              />
            </svg>
            <span
              className={styles.avatar}
              style={{ left: `${current.x}%`, top: `calc(${current.y}% - var(--space-4))` }}
              aria-hidden="true"
            />
            {onPractical && (
              <WorkbookPracticalPoint
                stage="experience"
                available={progress.observed}
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
                aria-current={experienceStop === index ? "step" : undefined}
                aria-label={`${stop.number} ${stop.name}${available[index] ? " 선택" : index === 1 ? " · 두 화면과 문제를 먼저 확인해요" : " · 개선 요청을 먼저 적어요"}`}
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
            <WorkbookMapTopics stage="experience" point={selectedStep} />
          </WorkbookMapLessonCard>
        </div>,
      )}
    </div>
  );
}
