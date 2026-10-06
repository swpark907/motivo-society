"use client";

// 지도 이동과 수업이 하나의 여정이다. 수업 중에도 부모가 지도를 유지해 위치를 보존한다.
import Image from "next/image";
import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import styles from "./WorkbookMap.module.scss";

const stops = [
  { x: 27.3, y: 72, name: "AI 이해하기", place: "첫 만남의 찻집" },
  { x: 53.2, y: 76.2, name: "AI 종류와 도구", place: "도구 장터" },
  { x: 77.8, y: 71, name: "도구 준비하기", place: "실습 쉼터" },
  { x: 72.4, y: 41.5, name: "AI와 첫 대화", place: "대화 서재" },
  { x: 48.6, y: 51.5, name: "에이전트와 바이브코딩", place: "작업 우체국" },
];
const dock = { x: 16.5, y: 80 };
const firstPath = [dock, { x: 20, y: 75 }, { x: 24, y: 74 }, stops[0]];
const nextPath = [stops[0], { x: 34, y: 75 }, { x: 42, y: 74 }, stops[1]];

export function WorkbookMap({
  onEnter,
  completed,
}: {
  onEnter: (lesson: number) => void;
  completed: number[];
}) {
  const arrowId = useId();
  const [motion, setMotion] = useState(true);
  const nextStop = completed.includes(0) ? (completed.includes(1) ? 2 : 1) : 0;
  const paths = [
    firstPath,
    nextPath,
    [stops[1], { x: 65, y: 77 }, { x: 69, y: 72 }, stops[2]],
    [stops[2], { x: 69, y: 73 }, { x: 67, y: 65 }, { x: 74, y: 54 }, stops[3]],
    [stops[3], { x: 75, y: 52 }, { x: 69, y: 59 }, { x: 59, y: 60 }, stops[4]],
  ];
  const [tutorial, setTutorial] = useState(true);
  const [moving, setMoving] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [target, setTarget] = useState(0);
  const [position, setPosition] = useState(dock);
  const frame = useRef<number | null>(null);
  const enter = useRef<HTMLButtonElement>(null);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );
  function walk(index: number) {
    if (moving || index > 1 || (index === 1 && !completed.includes(0))) return;
    if (current === index) {
      onEnter(index);
      return;
    }
    setTarget(index);
    setMoving(true);
    const path =
      current === -1
        ? index === 0
          ? firstPath
          : [...firstPath, ...nextPath.slice(1)]
        : index === 1
          ? nextPath
          : [...nextPath].reverse();
    function arrive() {
      frame.current = null;
      setPosition(stops[index]);
      setCurrent(index);
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
      <div className={styles.map} aria-label="카피바라의 AI 입문 지도">
        <div className={styles.canvas}>
          <Image
            src="/images/workbook/journey/world-1-map-clearings-v3.png"
            alt="찻집에서 장터와 서재로 길이 이어지는 카피바라의 학습 마을"
            width={1536}
            height={1024}
            sizes="(min-width: 1024px) 75vw, 100vw"
          />
          {tutorial && <div className={styles.shade} aria-hidden="true" />}
          <svg
            className={styles.routeGuide}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            data-motion={motion}
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
              <polyline
                key={i}
                points={path.map((point) => `${point.x},${point.y}`).join(" ")}
                data-next={i === nextStop}
                data-future={i > nextStop}
                markerEnd={`url(#${arrowId})`}
              />
            ))}
          </svg>
          <span
            className={styles.avatar}
            data-moving={moving}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            aria-hidden="true"
          />
          {!moving && current >= 0 && (
            <div
              className={styles.arrival}
              style={
                {
                  "--arrival-x": `${stops[current].x}%`,
                  "--arrival-y": `${stops[current].y}%`,
                } as CSSProperties
              }
              aria-label="도착한 장소"
            >
              <button
                ref={enter}
                aria-label={`${stops[current].name} 수업 시작`}
                onClick={() => onEnter(current)}
              >
                <span className={styles.arrivalCopy}>
                  <span className={styles.arrivalMeta}>LESSON 0{current + 1} · 도착했어요</span>
                  <strong>{stops[current].name}</strong>
                  <span className={styles.arrivalPlace}>{stops[current].place}</span>
                </span>
                <span className={styles.arrivalArrow} aria-hidden="true">
                  ↗
                </span>
              </button>
            </div>
          )}
          {stops.map((stop, i) => (
            <button
              key={stop.name}
              className={styles.point}
              data-next={i === nextStop}
              aria-describedby={i === nextStop ? "workbook-next-stop" : undefined}
              style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
              disabled={moving || i > 1 || (i === 1 && !completed.includes(0))}
              onClick={() => walk(i)}
              aria-label={`${stop.name}${i > 1 ? " · 준비 중" : i === 1 && !completed.includes(0) ? " · 첫 수업 후 열려요" : current === i ? " 수업 열기" : " 장소로 이동"}`}
            >
              <span aria-hidden="true">{completed.includes(i) ? "✓" : `0${i + 1}`}</span>
              <strong>
                {stop.name}
                {i === nextStop && <em>{i > 1 ? "다음 수업 · 준비 중" : "다음 목표"}</em>}
              </strong>
            </button>
          ))}
        </div>
        {tutorial && (
          <div className={styles.hint} aria-label="지도 사용 안내">
            <span>카피바라와 함께 배우기</span>
            <h2>
              {moving
                ? "길을 따라 이동하고 있어요"
                : current < 0
                  ? "01 포인트에서 시작해요"
                  : "도착한 장소에서 배워봐요"}
            </h2>
            <p>
              {current < 0
                ? "AI 이해하기 포인트를 누르면 카피바라가 걸어가요. 도착한 뒤 수업을 열어보세요."
                : "설명과 활동을 마치면 같은 장소로 돌아와요. 다음 포인트로 이어서 걸어가요."}
            </p>
            <button className={styles.skip} onClick={() => setTutorial(false)}>
              안내 접기
            </button>
          </div>
        )}
      </div>
      <p id="workbook-next-stop" className={styles.nextGoal}>
        다음 목표 · 0{nextStop + 1} {stops[nextStop].name}
        {nextStop > 1
          ? " — 준비 중이에요. 배운 수업을 복습할 수 있어요."
          : " — 강조된 포인트를 눌러보세요."}
      </p>
      <div className={styles.footer}>
        <p role="status">
          {moving
            ? `${stops[target].place} · 이동 중…`
            : current < 0
              ? "첫 목적지 · AI 이해하기"
              : `${stops[current].place}에 도착했어요.${completed.includes(current) ? " 배운 내용을 다시 보거나 다음 장소로 이동해요." : " 함께 배워볼까요?"}`}
        </p>
        <button className={styles.restart} onClick={() => setTutorial(true)}>
          지도 안내 다시보기
        </button>
        <button
          className={styles.restart}
          aria-pressed={!motion}
          onClick={() => setMotion(!motion)}
        >
          {motion ? "경로 움직임 멈추기" : "경로 움직임 켜기"}
        </button>
      </div>
      <ol className={styles.stopList}>
        {stops.map((stop, i) => (
          <li key={stop.name}>
            <strong>
              0{i + 1} {stop.name}
            </strong>
            <span>
              {i > 1
                ? "준비 중"
                : completed.includes(i)
                  ? "이번 방문에서 확인 완료"
                  : i === 1 && !completed.includes(0)
                    ? "첫 수업 후 열려요"
                    : "지도에서 이동해 시작해요"}
            </span>
          </li>
        ))}
      </ol>
      <small>
        첫 두 장소에서 수업을 체험할 수 있어요. 뒤 장소의 내용은 준비 중이며, 새로고침하면 이번
        방문의 진행은 초기화돼요.
      </small>
    </div>
  );
}
