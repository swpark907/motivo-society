// 1-1-1 인트로 카피바라 공부 장면의 배치와 재생 순서.
// 캐릭터·의자·책상이 한 장에 그려진 장면에서 상반신·노트북 영역만 비워 두고, 그 자리를 프레임으로 채운다.
// 겹쳐 덮지 않고 나눠 맞추므로 팔이 비켜난 자리에 원래 팔이 비치거나 반투명 그림자가 겹치지 않는다.
// 움직임 프레임은 capy-study-motion.png 한 줄(120×80px 칸)에 있다.

export const SCENE = { width: 224, height: 160 } as const;
export const ATLAS_FRAMES = 39;

/** 장면 좌표(px). */
export const LAYERS = {
  scene: { src: "/images/workbook/intro-sprite/study-scene.png", x: 0, y: 0, ...SCENE },
  motion: { x: 40, y: 24, width: 120, height: 80 },
} as const;

export const ATLAS_SRC = "/images/workbook/intro-sprite/capy-study-motion.png";

/** 책상 위 노트북(장면 좌표). 강의 인트로 1→2장면에서 브라우저 창이 여기서 커져 나온다. */
export const LAPTOP = { x: 100, y: 70, width: 52, height: 32 } as const;

const range = (start: number, count: number) => Array.from({ length: count }, (_, i) => start + i);

/**
 * 도입부: 서서 인사 → 의자·책상 등장 → 놀람 → 앉은 공부 장면으로 컷.
 * 서 있는 캐릭터는 의자 등받이와 책상 사이(앉을 자리)에 서 있고, 머리 높이가 앉은 장면과 거의 같다.
 * 가구는 캐릭터를 지운 기준 장면을 등받이(뒤)와 나머지(앞)로 나눈 것이다.
 */
export const INTRO_LAYERS = {
  furnitureBack: "/images/workbook/intro-sprite/intro-furniture-back.png",
  furnitureFront: "/images/workbook/intro-sprite/intro-furniture-front.png",
  stand: {
    src: "/images/workbook/intro-sprite/capy-intro-stand.png",
    x: 45,
    y: 18,
    width: 96,
    height: 144,
  },
} as const;

// 서 있는 캐릭터 아틀라스(96×144px 칸) 안의 시작 칸.
const STAND = 0; // 1칸, 서 있는 기준 자세
const WAVE_IN = 1; // 6칸, 기준 → 손 흔드는 자세(6번째 칸이 핵심 자세)
const WAVE_HOLD = 7; // 5칸
const SURPRISE_IN = 12; // 4칸
const SURPRISE_KEY = 16; // 놀람 표시가 함께 그려진 핵심 자세

/** pose: 서 있는 캐릭터 칸, furniture: 가구 불투명도(0~1). */
export type IntroStep = { pose: number; furniture: number; ms: number };

const intro = (poses: number[], ms: number, furniture = 0): IntroStep[] =>
  poses.map((pose) => ({ pose, furniture, ms }));

export const INTRO_STEPS: readonly IntroStep[] = [
  ...intro([STAND], 700),
  ...intro(range(WAVE_IN, 6), 110),
  ...Array.from({ length: 2 }, () => intro([...range(WAVE_HOLD, 5), WAVE_IN + 5], 130)).flat(),
  ...intro(range(WAVE_IN, 5).reverse(), 110),
  ...intro([STAND], 500),
  // 가구는 세 단계로 짧게 나타난다.
  { pose: STAND, furniture: 1 / 3, ms: 60 },
  { pose: STAND, furniture: 2 / 3, ms: 60 },
  { pose: STAND, furniture: 1, ms: 300 },
  ...intro(range(SURPRISE_IN, 4), 80, 1),
  ...intro([SURPRISE_KEY], 900, 1),
];

// 공부 장면 아틀라스 안의 시작 칸. typing 0번 칸이 모든 동작이 시작·복귀하는 앉은 기준 자세다.
const TYPING = 0; // 8칸, 0~7
const MEMO_IN = 8; // 7칸, 기준 → 펜으로 쓰는 자세
const MEMO_HOLD = 15; // 5칸, 쓰는 자세에서 시작·복귀
const THINK_IN = 20; // 7칸, 기준 → 머리 짚기
const THINK_HOLD = 27; // 5칸
const CHIN_IN = 32; // 7칸, 기준 → 턱 괴기

export const REST_FRAME = TYPING;

export type SpriteStep = { frame: number; ms: number };
export type Gesture = "memo" | "think" | "chin";
export const GESTURES: readonly Gesture[] = ["memo", "think", "chin"];

const steps = (frames: number[], ms: number): SpriteStep[] =>
  frames.map((frame) => ({ frame, ms }));

export function typingSteps(times: number): SpriteStep[] {
  return Array.from({ length: times }, () => steps(range(TYPING, 8), 120)).flat();
}

const transition = { memo: MEMO_IN, think: THINK_IN, chin: CHIN_IN } as const;

/** 기준 자세 → 핵심 자세 → (유지) → 역재생으로 기준 자세 복귀. */
export function gestureSteps(gesture: Gesture): SpriteStep[] {
  const start = transition[gesture];
  const key = start + 6;
  const enter = steps(range(start + 1, 6), 110);
  const leave = steps(range(start + 1, 5).reverse(), 110);
  let hold: SpriteStep[];
  if (gesture === "chin") {
    hold = [{ frame: key, ms: 1800 }];
  } else {
    const loop = gesture === "memo" ? MEMO_HOLD : THINK_HOLD;
    const loops = gesture === "memo" ? 3 : 2;
    hold = Array.from({ length: loops }, () => [
      ...steps(range(loop, 5), 130),
      { frame: key, ms: 130 },
    ]).flat();
  }
  return [...enter, ...hold, ...leave, { frame: REST_FRAME, ms: 400 }];
}

/**
 * 타이핑 2~4회 뒤 직전과 다른 동작 하나. random은 [0, 1) 값을 돌려준다.
 */
export function nextStudyRound(
  previous: Gesture | null,
  random: () => number,
): { gesture: Gesture; steps: SpriteStep[] } {
  const typingTimes = 2 + Math.floor(random() * 3);
  const options = GESTURES.filter((gesture) => gesture !== previous);
  const gesture = options[Math.floor(random() * options.length)];
  return { gesture, steps: [...typingSteps(typingTimes), ...gestureSteps(gesture)] };
}
