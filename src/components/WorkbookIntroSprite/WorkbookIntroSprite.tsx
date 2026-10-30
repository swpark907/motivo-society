"use client";

// 프레임을 시간 순서로 바꾸고, 정지 조작과 모션 줄이기 설정에 반응해야 해서 클라이언트 컴포넌트다.
// 장면과 움직임 프레임을 원본 크기 캔버스 한 장에 그린 뒤 통째로 키운다. 두 레이어를 따로 키우면
// 비정수 배율(모바일)에서 경계에 머리카락 같은 틈이 생긴다.

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import {
  ATLAS_SRC,
  INTRO_LAYERS,
  INTRO_STEPS,
  LAYERS,
  REST_FRAME,
  SCENE,
  nextStudyRound,
  type Gesture,
  type IntroStep,
  type SpriteStep,
} from "@/lib/workbook-intro-sprite";
import styles from "./WorkbookIntroSprite.module.scss";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

type Shot = ({ kind: "intro" } & IntroStep) | ({ kind: "study" } & SpriteStep);
type Images = Record<"scene" | "motion" | "back" | "front" | "stand", HTMLImageElement>;

const REST: Shot = { kind: "study", frame: REST_FRAME, ms: 0 };
const introQueue = (): Shot[] => INTRO_STEPS.map((step) => ({ kind: "intro", ...step }));

function draw(context: CanvasRenderingContext2D, images: Images, shot: Shot) {
  context.clearRect(0, 0, SCENE.width, SCENE.height);
  if (shot.kind === "study") {
    const { x, y, width, height } = LAYERS.motion;
    context.drawImage(images.scene, 0, 0);
    context.drawImage(images.motion, shot.frame * width, 0, width, height, x, y, width, height);
    return;
  }
  const { x, y, width, height } = INTRO_LAYERS.stand;
  context.globalAlpha = shot.furniture;
  context.drawImage(images.back, 0, 0);
  context.globalAlpha = 1;
  context.drawImage(images.stand, shot.pose * width, 0, width, height, x, y, width, height);
  context.globalAlpha = shot.furniture;
  context.drawImage(images.front, 0, 0);
  context.globalAlpha = 1;
}

export function WorkbookIntroSprite({
  intro = true,
  fill = false,
  canvasRef,
}: {
  /** false면 도입부 없이 앉은 공부 장면부터 시작한다(같은 화면에 다시 나올 때). */
  intro?: boolean;
  /** true면 부모 영역을 채우고 정지 버튼 하나만 둔다(강의 인트로 캐릭터 패널). */
  fill?: boolean;
  /** 부모가 노트북 위치 등을 계산할 때 쓰는 캔버스 참조. */
  canvasRef?: RefObject<HTMLCanvasElement | null>;
} = {}) {
  const [shot, setShot] = useState<Shot>(REST);
  // auto: 모션 줄이기 설정을 따른다. play/stop: 사용자가 직접 고른 상태.
  const [choice, setChoice] = useState<"auto" | "play" | "stop">("auto");
  // 처음부터 보기를 누를 때마다 올려 재생 효과를 다시 시작한다.
  const [run, setRun] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  const playing = choice === "play" || (choice === "auto" && !reducedMotion);
  // 도입부는 처음 자동 재생(모션 줄이기가 아닐 때)이나 처음부터 보기에서만 재생한다.
  const [firstQueue] = useState(() => (intro ? introQueue() : []));
  const queue = useRef<Shot[]>(firstQueue);
  const lastGesture = useRef<Gesture | null>(null);
  const ownCanvas = useRef<HTMLCanvasElement>(null);
  const canvas = canvasRef ?? ownCanvas;
  const [images, setImages] = useState<Images>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadImage(LAYERS.scene.src),
      loadImage(ATLAS_SRC),
      loadImage(INTRO_LAYERS.furnitureBack),
      loadImage(INTRO_LAYERS.furnitureFront),
      loadImage(INTRO_LAYERS.stand.src),
    ])
      .then(([scene, motion, back, front, stand]) => {
        if (active) setImages({ scene, motion, back, front, stand });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!playing || !images) return;
    let timer: number;
    const tick = () => {
      if (queue.current.length === 0) {
        const round = nextStudyRound(lastGesture.current, Math.random);
        lastGesture.current = round.gesture;
        queue.current = round.steps.map((step) => ({ kind: "study", ...step }));
      }
      const next = queue.current.shift()!;
      setShot(next);
      timer = window.setTimeout(tick, next.ms);
    };
    timer = window.setTimeout(tick, 0);
    return () => window.clearTimeout(timer);
  }, [playing, images, run]);

  const shown = playing ? shot : REST;

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (context && images) draw(context, images, shown);
  }, [canvas, images, shown]);

  // 멈췄다(직접 또는 모션 줄이기로) 다시 보면 앉은 기준 자세에서 공부 장면부터 잇는다.
  // 남은 도입부·동작과 마지막 프레임을 함께 버려야 재개 순간 이전 자세가 비치지 않는다.
  const toggle = () => {
    queue.current = [];
    setShot(REST);
    setChoice(playing ? "stop" : "play");
  };

  const replay = () => {
    queue.current = introQueue();
    setShot(REST);
    setChoice("play");
    setRun((value) => value + 1);
  };

  if (failed) {
    return (
      <figure className={`${styles.figure} ${fill ? `paper ${styles.fill}` : ""}`}>
        <p className={styles.fallback}>장면 그림을 불러오지 못했어요. 새로고침해 주세요.</p>
      </figure>
    );
  }

  return (
    <figure className={`${styles.figure} ${fill ? `paper ${styles.fill}` : ""}`}>
      <canvas
        ref={canvas}
        className={styles.scene}
        width={SCENE.width}
        height={SCENE.height}
        role="img"
        aria-label={
          playing && intro
            ? "선글라스를 쓴 카피바라가 인사하고, 갑자기 나타난 책상에 놀란 뒤 앉아서 타이핑하고, 메모하고, 머리를 짚고, 턱을 괴며 공부하는 모습"
            : playing
              ? "선글라스를 쓴 카피바라가 책상에 앉아 타이핑하고, 메모하고, 머리를 짚고, 턱을 괴며 공부하는 모습"
              : "선글라스를 쓴 카피바라가 책상에 앉아 노트북으로 공부하는 모습"
        }
      />
      <div className={styles.controls}>
        <button type="button" className={styles.toggle} onClick={toggle}>
          {playing ? "움직임 멈추기" : "움직임 보기"}
        </button>
        {!fill && (
          <button type="button" className={styles.toggle} onClick={replay}>
            처음부터 보기
          </button>
        )}
      </div>
    </figure>
  );
}
