"use client";

// 지도 이동과 수업이 하나의 여정이다. 수업 중에도 부모가 지도를 유지해 위치를 보존한다.
import { WorkbookPanelDisclosure } from "./WorkbookPanelDisclosure";
import { getWorkbookCourseLesson } from "@/lib/workbook-course";
import { WorkbookMapLessonCard } from "./WorkbookMapLessonCard";
import Image from "next/image";
import { WorkbookPracticalPoint } from "./WorkbookPracticalPoint";
import { WorkbookMapTopics } from "./WorkbookMapTopics";
import { useWorkbookLessonState } from "./useWorkbookLessonState";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { setupStatusLabels, type SetupStatus } from "./WorkbookSetupLesson";
import { type PracticeRecord } from "./WorkbookPracticeLesson";
import type { DataRecord } from "./WorkbookDataLesson";
import type { PublishRecord } from "./WorkbookPublishLesson";
import type { ExperienceRecord } from "./WorkbookExperienceLesson";
import { type ProjectRecord } from "./WorkbookProjectLesson";
import { WorkbookClassSummary } from "./WorkbookClassSummary";
import { WorkbookApplicationSummary } from "./WorkbookApplicationRecord";
import styles from "./WorkbookMap.module.scss";

const stops = [
  { x: 26, y: 64, place: "첫 만남의 찻집" },
  { x: 53, y: 67, place: "도구 장터" },
  { x: 79, y: 58, place: "실습 쉼터" },
  { x: 69, y: 28, place: "대화 서재" },
  { x: 36, y: 26, place: "첫 제작 공방" },
].map((stop, point) => ({
  ...stop,
  name: getWorkbookCourseLesson("agent", point).title,
  number: getWorkbookCourseLesson("agent", point).number,
}));
const dock = { x: 15, y: 79 };
/** 1-0: the class intro sits at the starting dock. It is not a lesson and never locks anything. */
const INTRO = -1;
const pointAt = (index: number) => (index === INTRO ? dock : stops[index]);
const firstPath = [dock, { x: 19, y: 68 }, { x: 23, y: 65 }, stops[0]];
const nextPath = [stops[0], { x: 36, y: 67 }, { x: 44, y: 68 }, stops[1]];

export function WorkbookMap({
  onEnter,
  completed,
  setupStatus,
  practice,
  project,
  projectCompleted,
  experience,
  experienceCompleted,
  data,
  dataCompleted,
  publish,
  publishCompleted,
  currentStop,
  onArrive,
  showMap = true,
  panelTarget,
  onPractical,
  onIntro,
  introNext = false,
}: {
  onEnter: (lesson: number) => void;
  completed: number[];
  setupStatus: SetupStatus | null;
  practice: Record<number, PracticeRecord>;
  project: ProjectRecord;
  projectCompleted: boolean;
  experience: ExperienceRecord;
  experienceCompleted: boolean;
  data: DataRecord;
  dataCompleted: boolean;
  publish: PublishRecord;
  publishCompleted: boolean;
  currentStop: number;
  onArrive: (stop: number) => void;
  showMap?: boolean;
  panelTarget?: HTMLElement | null;
  onPractical?: () => void;
  /** Opens the class intro from the 1-0 point. */
  onIntro?: () => void;
  /** The intro hasn't been watched yet, so 1-0 is the next target. */
  introNext?: boolean;
}) {
  const [practicalSelected, setPracticalSelected] = useWorkbookLessonState(
    "map-practical-agent",
    false,
  );
  const arrowId = useId();
  const renderPanel = (content: ReactNode) =>
    panelTarget ? createPortal(content, panelTarget) : content;
  const firstOpen = stops.findIndex((_, index) => !completed.includes(index));
  const nextStop = introNext && onIntro ? INTRO : firstOpen;
  const isLocked = (index: number) =>
    !completed.includes(index) && index > 0 && !completed.includes(index - 1);
  const lockLabel = (index: number) =>
    [
      "",
      " · 첫 수업 후 열려요",
      " · 둘째 수업 후 열려요",
      " · 셋째 수업 후 열려요",
      " · 넷째 수업 후 열려요",
    ][index];
  const paths = [
    firstPath,
    nextPath,
    [stops[1], { x: 66, y: 69 }, { x: 70, y: 64 }, stops[2]],
    [stops[2], { x: 69, y: 51 }, { x: 67, y: 44 }, { x: 74, y: 35 }, stops[3]],
    [stops[3], { x: 58, y: 29 }, { x: 47, y: 28 }, stops[4]],
  ];
  const [moving, setMoving] = useState(false);
  const current = currentStop;
  const [position, setPosition] = useState(pointAt(currentStop));
  const frame = useRef<number | null>(null);
  const enter = useRef<HTMLButtonElement>(null);
  const pointButtons = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );
  function walk(index: number) {
    if (moving || isLocked(index)) return;
    setPracticalSelected(false);
    if (current === index) {
      requestAnimationFrame(() => enter.current?.focus());
      return;
    }
    setMoving(true);
    const path = [position];
    if (current < index) {
      for (let i = current + 1; i <= index; i++) path.push(...paths[i].slice(1));
    } else {
      for (let i = current; i > index; i--) path.push(...paths[i].slice(0, -1).reverse());
    }
    function arrive() {
      frame.current = null;
      setPosition(pointAt(index));
      onArrive(index);
      setMoving(false);
      requestAnimationFrame(() => enter.current?.focus());
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      arrive();
      return;
    }
    let start: number | null = null;
    function tick(now: number) {
      start ??= now;
      const progress = Math.min((now - start) / 2500, 1);
      const segment = Math.min(Math.floor(progress * (path.length - 1)), path.length - 2);
      const t = progress * (path.length - 1) - segment;
      const a = path[segment],
        b = path[segment + 1];
      setPosition({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      if (progress === 1) arrive();
      else frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
  }
  return (
    <div className={styles.wrapper}>
      {showMap && (
        <>
          <p className={styles.mobileNote}>
            지도를 좌우로 움직여 기본 학습 5곳과 선택 심화 1곳을 살펴보세요. 장소를 선택하면 학습
            패널에서 수업을 시작할 수 있어요.
          </p>
          <div className={styles.mapViewport}>
            <div
              className={styles.map}
              role="region"
              tabIndex={0}
              aria-label="카피바라의 AI 도구 준비하기 지도"
            >
              <div className={styles.canvas}>
                <Image
                  src="/images/workbook/journey/ai-beginner-five-places-v1.png"
                  alt="찻집·장터·실습 쉼터·대화 서재·제작 공방의 다섯 장소를 하나의 길로 연결한 학습 마을"
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
                  <defs>
                    <marker
                      id={arrowId}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="3"
                      markerHeight="3"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                    </marker>
                  </defs>
                  {paths.map((path, i) => (
                    <g key={i}>
                      {i === nextStop && (
                        <polyline
                          className={styles.routeBacking}
                          points={path.map((point) => `${point.x},${point.y}`).join(" ")}
                        />
                      )}
                      <polyline
                        points={path.map((point) => `${point.x},${point.y}`).join(" ")}
                        data-next={i === nextStop}
                        data-future={nextStop >= 0 && i > nextStop}
                        markerEnd={`url(#${arrowId})`}
                      />
                    </g>
                  ))}
                </svg>
                <span
                  className={styles.avatar}
                  data-moving={moving}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  aria-hidden="true"
                />
                {onPractical && (
                  <WorkbookPracticalPoint
                    stage="agent"
                    available={completed.includes(4) && !moving}
                    selected={practicalSelected}
                    onSelect={() => setPracticalSelected(true)}

                    onEnter={onPractical}
                    panelTarget={panelTarget}
                  />
                )}
                {onIntro && (
                  <button
                    className={styles.point}
                    data-next={nextStop === INTRO}
                    style={{ left: `${dock.x}%`, top: `${dock.y}%` }}
                    disabled={moving}
                    onClick={() => walk(INTRO)}
                    aria-label={`1-0 클래스 인트로${current === INTRO ? " 학습 패널 열기" : " 장소로 이동"}`}
                  >
                    <span aria-hidden="true">1-0</span>
                    <strong>
                      클래스 인트로
                      {nextStop === INTRO && <em>시작점</em>}
                    </strong>
                  </button>
                )}
                {stops.map((stop, i) => (
                  <button
                    key={stop.name}
                    ref={(element) => {
                      pointButtons.current[i] = element;
                    }}
                    className={styles.point}
                    data-next={i === nextStop}
                    aria-describedby={
                      panelTarget && i === nextStop ? "workbook-next-stop" : undefined
                    }
                    style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                    disabled={moving || isLocked(i)}
                    onClick={() => walk(i)}
                    aria-label={`${stop.number} ${stop.name}${isLocked(i) ? lockLabel(i) : current === i ? " 학습 패널 열기" : " 장소로 이동"}`}
                  >
                    <span aria-hidden="true">{stop.number}</span>
                    <strong>
                      {stop.name}
                      {completed.includes(i) && <small>학습 확인</small>}
                      {i === nextStop && <em>다음 목표</em>}
                    </strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {renderPanel(
            <div className={styles.mapPanel}>
              {!moving && current === INTRO && onIntro && !practicalSelected && (
                <WorkbookMapLessonCard
                  title="클래스 인트로"
                  meta={`1-0 · ${nextStop === INTRO ? "여기서 시작해요" : "클래스 인트로"}`}
                  description="이 클래스에서 무엇을 만들고 어떻게 배우는지 먼저 살펴봐요."
                  startLabel="인트로 보기"
                  startRef={enter}
                  onStart={onIntro}
                />
              )}
              {!moving && current >= 0 && !practicalSelected && (
                <WorkbookMapLessonCard
                  completed={completed.includes(current)}
                  title={stops[current].name}
                  meta={`${stops[current].number} · ${completed.includes(current) ? "학습 확인" : current === nextStop ? "다음 수업" : "선택한 수업"}`}
                  startRef={enter}
                  onStart={() => onEnter(current)}
                >
                  <WorkbookMapTopics stage="agent" point={current} />
                </WorkbookMapLessonCard>
              )}
              {moving && <p role="status">수업 위치로 이동 중…</p>}
              {setupStatus !== null && <small>{setupStatusLabels[setupStatus]}</small>}
            </div>,
          )}
        </>
      )}
      {firstOpen < 0 &&
        renderPanel(
          <WorkbookPanelDisclosure title="학습·제작 기록 확인" className={styles.recordPanel}>
            <section className={styles.recap} aria-label="첫 맵의 학습 기록">
              <h2>{showMap ? "첫 맵에서 챙긴 것" : "AI 도구 준비하기와 제작 기록"}</h2>
              <p>
                AI의 도움과 한계, 모델과 도구, 준비, 첫 대화, 파일 작업의 흐름을 배웠어요.
                <strong>예시 복습과 실제 컴퓨터 실습 기록은 구분</strong>해요.
              </p>
              {[3, 4].map((index) => (
                <details key={index}>
                  <summary>
                    {stops[index].name} ·{" "}
                    {practice[index].mode === "computer" ? "실제 실습 본인 확인" : "예시 복습"}
                  </summary>
                  <h3>첫 요청</h3>
                  <p>{practice[index].request}</p>
                  <h3>확인한 점</h3>
                  <p>{practice[index].observation}</p>
                  <h3>수정 요청</h3>
                  <p>{practice[index].revision}</p>
                </details>
              ))}
              <WorkbookApplicationSummary />
              <h3>같은 공방에서 내 홈페이지로</h3>
              <p>
                연습한 소개 페이지를 내 주제로 바꿔봐요. 읽을 사람과 보여줄 내용을 정하고, 제작
                요청과 첫 화면 확인까지 이어가요. 기획하고 첫 화면 만들기 지도에서 같은 기록으로
                이어가요.
              </p>
              <button onClick={() => onEnter(5)}>
                {projectCompleted
                  ? "2단원 기획하고 첫 화면 만들기 다시보기"
                  : "2단원 기획하고 첫 화면 만들기로 →"}
              </button>
              {projectCompleted && (
                <details>
                  <summary>
                    내 홈페이지 ·{" "}
                    {project.mode === "computer" ? "실제 제작 본인 확인" : "기획 미리보기 복습"}
                  </summary>
                  <h3>{project.title}</h3>
                  <p>읽을 사람: {project.audience}</p>
                  <p>목적: {project.purpose}</p>
                  <h4>제작 요청</h4>
                  <p>{project.request}</p>
                  <h4>확인한 점</h4>
                  <p>{project.observation}</p>
                </details>
              )}
              <h3>다음 단원 · 반응형 화면 만들기</h3>
              <p>
                내 소개 페이지를 휴대폰과 넓은 화면에서 보고, 화면 밖으로 나가는 한 부분을 고쳐
                전후를 비교해요. 반응형 화면 만들기 지도에서 관찰·개선 요청·전후 확인을 이어가요.
              </p>
              <button disabled={!projectCompleted} onClick={() => onEnter(6)}>
                {experienceCompleted
                  ? "반응형 화면 만들기 단원 다시보기"
                  : "작은 화면에서 예시 페이지 확인하기 시작"}
              </button>
              {!projectCompleted && (
                <p>
                  앞의 내 홈페이지 기획·첫 화면 확인을 마치면 열려요. 기획을 바꾸면 화면 비교 기록도
                  다시 시작해요.
                </p>
              )}
              {experienceCompleted && (
                <details>
                  <summary>반응형 화면 만들기 · 예시 비교 복습</summary>
                  <h4>불편했던 점</h4>
                  <p>{experience.observation}</p>
                  <h4>개선 요청</h4>
                  <p>{experience.request}</p>
                  <h4>달라진 점</h4>
                  <p>{experience.comparison}</p>
                </details>
              )}
              <h3>다음 단원 · 기능과 데이터 저장</h3>
              <p>
                같은 홈페이지에 한 줄을 표시하고, 새로고침과 브라우저 저장을 흉내 내며 값이 남는
                경우를 비교해요. 다른 기기에서 함께 읽으려면 무엇이 필요한지도 살펴봐요. 동작과
                데이터 지도에서 입력·저장 비교·다른 기기 판단을 이어가요.
              </p>
              <button
                disabled={!experienceCompleted || !projectCompleted}
                onClick={() => onEnter(7)}
              >
                {dataCompleted
                  ? "기능과 데이터 저장 단원 다시보기"
                  : "한 줄 메모로 동작과 저장 알아보기 시작"}
              </button>
              {(!experienceCompleted || !projectCompleted) && (
                <p>앞의 반응형 화면 만들기를 마치면 열려요. 실제 저장소에 쓰는 과제가 아니에요.</p>
              )}
              {dataCompleted && projectCompleted && experienceCompleted && (
                <details>
                  <summary>기능과 데이터 저장 · 저장 시뮬레이션 복습</summary>
                  <h4>화면에 표시한 문장</h4>
                  <p>{data.source}</p>
                  <h4>표시·저장·공유가 다른 이유</h4>
                  <p>{data.reason}</p>
                </details>
              )}
              <h3>다음 단원 · 배포하고 고치기</h3>
              <p>
                같은 홈페이지를 공개 전에 읽고 눌러봐요. 주소와 실제 배포를 구분하고, 버튼 문제를
                재현해 한 부분을 고친 뒤 다시 확인해요. 배포하고 고치기 지도에서 같은 기록으로
                이어가며 실제 공개는 별도예요.
              </p>
              <button
                disabled={!dataCompleted || !experienceCompleted || !projectCompleted}
                onClick={() => onEnter(8)}
              >
                {publishCompleted
                  ? "배포하고 고치기 단원 다시보기"
                  : "친구에게 보여주기 전후 확인하기 시작"}
              </button>
              {(!dataCompleted || !experienceCompleted || !projectCompleted) && (
                <p>
                  앞의 기능과 데이터 저장을 마치면 열려요. 실제 파일 업로드나 계정 생성은 하지
                  않아요.
                </p>
              )}
              {publishCompleted && dataCompleted && experienceCompleted && projectCompleted && (
                <details>
                  <summary>배포하고 고치기 · 예시 점검 복습 · 실제 배포 별도</summary>
                  <h4>주소와 실제 배포가 다른 이유</h4>
                  <p>{publish.addressReason}</p>
                  <h4>문제 기록과 수정 요청</h4>
                  <p>{publish.request}</p>
                  <h4>다시 눌러 확인한 변화</h4>
                  <p>{publish.comparison}</p>
                </details>
              )}
              {publishCompleted && dataCompleted && experienceCompleted && projectCompleted && (
                <>
                  <h3>이번 방문의 제작 흐름에서 챙긴 것</h3>
                  <WorkbookClassSummary />
                </>
              )}
            </section>
          </WorkbookPanelDisclosure>,
        )}
    </div>
  );
}
