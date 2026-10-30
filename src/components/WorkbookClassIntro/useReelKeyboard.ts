"use client";

import { useEffect, useRef } from "react";

/** Shortcut list for aria-keyshortcuts on the scene. */
export const REEL_KEYSHORTCUTS = "Space ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight";
export const REEL_KEY_HINT =
  "스페이스: 일시정지·재생 · ←/→: 이전·다음 단계(끝에서 →는 다음 장면) · Shift+←/→: 5초";

/** Seconds moved by Shift+arrow. */
const SEEK_MS = 5000;
/** Pressing ← this soon after a step starts goes to the step before it (like a video chapter). */
const BACK_GRACE_MS = 800;

/**
 * Keys the intro should leave alone: typing, modified shortcuts, or already handled events.
 * Shared by the autoplay scenes and the intro's scene-to-scene arrows.
 */
export function isIgnoredKey(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return true;
  const target = event.target instanceof Element ? event.target : null;
  return Boolean(target?.closest("input, textarea, select, [contenteditable='true']"));
}

/**
 * Keyboard control for the intro's autoplay scenes while one is on screen, like a slide with builds:
 * Space pauses/plays, ←/→ move between steps and past the first/last step to the previous/next scene,
 * Shift+←/→ seek by 5 seconds. Space on a focused button or link is left to the browser
 * so it isn't pressed twice. With `still` (reduced motion) the arrows only change scenes.
 */
export function useReelKeyboard({
  t,
  end,
  steps,
  rate = 1,
  disabled = false,
  still = false,
  toggle,
  seek,
  onPrev,
  onNext,
}: {
  /** Current time on the scene's clock (ms). */
  t: number;
  end: number;
  /** Start times of each step on the scene's clock, ascending. */
  steps: readonly number[];
  /** Clock ms per real ms (for scenes that play faster than real time). */
  rate?: number;
  /** Ignore every key (e.g. while the scene is still arriving). */
  disabled?: boolean;
  /** The scene shows its final frame only; arrows move between scenes. */
  still?: boolean;
  toggle: () => void;
  /** Moves the clock to this time; the scene decides whether to keep playing. */
  seek: (ms: number) => void;
  /** Called on ← before the first step (previous scene). */
  onPrev?: () => void;
  /** Called on → after the last step (next scene). */
  onNext?: () => void;
}) {
  // The listener reads the latest values without re-subscribing every tick.
  const latest = useRef({ t, end, steps, rate, disabled, still, toggle, seek, onPrev, onNext });
  useEffect(() => {
    latest.current = { t, end, steps, rate, disabled, still, toggle, seek, onPrev, onNext };
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const now = latest.current;
      if (now.disabled || isIgnoredKey(event)) return;
      const target = event.target instanceof Element ? event.target : null;

      if (event.key === " ") {
        if (now.still || target?.closest("button, a, summary, [role='button']")) return;
        event.preventDefault();
        now.toggle();
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const forward = event.key === "ArrowRight";

      if (now.still) {
        const go = forward ? now.onNext : now.onPrev;
        if (!go) return;
        event.preventDefault();
        go();
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        const delta = SEEK_MS * now.rate * (forward ? 1 : -1);
        now.seek(Math.min(now.end, Math.max(0, now.t + delta)));
        return;
      }
      if (forward) {
        const next = now.steps.find((start) => start > now.t + 1);
        if (next !== undefined) now.seek(next);
        else if (now.onNext) now.onNext();
        else now.seek(now.end);
      } else {
        const earlier = now.steps.filter((start) => start < now.t - BACK_GRACE_MS * now.rate);
        if (earlier.length) now.seek(earlier[earlier.length - 1]);
        else if (now.t > BACK_GRACE_MS * now.rate) now.seek(0);
        else now.onPrev?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
