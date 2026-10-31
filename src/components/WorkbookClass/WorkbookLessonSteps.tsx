"use client";

// Client component: the common lesson bottom bar reads which screen the lesson is on,
// listens for ←/→, and inspects the lesson's own next button to explain why it is blocked.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isIgnoredKey } from "@/components/WorkbookClassIntro/useReelKeyboard";
import system from "./WorkbookLesson.module.scss";

type Steps = { current: number; total: number; seen: number };

const StepsContext = createContext<{
  steps: Steps | null;
  publish: (current: number, total: number) => void;
} | null>(null);

/** Holds the screen position of the lesson inside the cover (one lesson at a time). */
export function WorkbookLessonStepsProvider({ children }: { children: ReactNode }) {
  const [steps, setSteps] = useState<Steps | null>(null);
  const publish = useCallback((current: number, total: number) => {
    setSteps((prev) => {
      const seen = Math.max(current, prev && prev.total === total ? prev.seen : 0);
      return prev && prev.current === current && prev.total === total && prev.seen === seen
        ? prev
        : { current, total, seen };
    });
  }, []);
  return <StepsContext.Provider value={{ steps, publish }}>{children}</StepsContext.Provider>;
}

/** Called by the lesson header with the screen it shows. */
export function usePublishLessonStep(current: number, total: number, enabled: boolean) {
  const context = useContext(StepsContext);
  const publish = context?.publish;
  useLayoutEffect(() => {
    if (enabled) publish?.(current, total);
  }, [publish, current, total, enabled]);
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Dots, "3 / 11", the reason next is blocked, and ←/→ for the lesson's bottom bar.
 * It sits inside the lesson's own navigation, between its previous and next buttons,
 * and drives those buttons so each lesson keeps its own rules (quizzes, required input).
 */
export function WorkbookLessonStepBar() {
  const context = useContext(StepsContext);
  const steps = context?.steps ?? null;
  const self = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  // The lesson's own buttons: the bar's hint is marked data-step-ui so it is never mistaken for them.
  const buttons = useCallback(() => {
    const nav = self.current?.parentElement;
    const all = Array.from(nav?.children ?? []).filter(
      (element): element is HTMLButtonElement =>
        element instanceof HTMLButtonElement && !element.hasAttribute("data-step-ui"),
    );
    const next = all.at(-1) ?? null;
    const previous = all.length > 1 ? all[0] : null;
    return { previous, next };
  }, []);

  // Watch the lesson for its next button turning blocked/unblocked and say why it is blocked.
  useEffect(() => {
    const lesson = self.current?.closest("section");
    if (!lesson) return;
    function update() {
      const { previous, next } = buttons();
      // 인트로처럼 이전에는 ←, 다음에는 →를 붙인다(문구에 이미 있으면 그대로).
      for (const [button, arrow, mark] of [
        [previous, "←", "prev"],
        [next, "→", "next"],
      ] as const) {
        if (!button) continue;
        const has = button.textContent?.includes(arrow);
        if (has) button.removeAttribute("data-step-arrow");
        else if (button.dataset.stepArrow !== mark) button.dataset.stepArrow = mark;
      }
      if (!next?.disabled) {
        setBlocked(null);
        return;
      }
      // 본문(하단 바 제외)에서 아직 하지 않은 일을 찾아 이유를 고른다.
      const inBody = (selector: string) =>
        Array.from(lesson?.querySelectorAll<HTMLElement>(selector) ?? []).filter(
          (element) => !element.closest("aside") && element.getClientRects().length > 0,
        );
      const choices = inBody("button[aria-pressed], [role='radio'], input[type='radio']");
      const unanswered =
        choices.length > 0 &&
        !choices.some(
          (element) =>
            element.getAttribute("aria-pressed") === "true" ||
            element.getAttribute("aria-checked") === "true" ||
            (element as HTMLInputElement).checked,
        );
      const empty = inBody("textarea, input[type='text']").some(
        (element) => !(element as HTMLInputElement).value.trim(),
      );
      const unchecked = inBody("input[type='checkbox']").some(
        (element) => !(element as HTMLInputElement).checked,
      );
      setBlocked(
        unanswered
          ? "보기를 고르면 넘어갈 수 있어요"
          : empty
            ? "빈칸을 채우면 넘어갈 수 있어요"
            : unchecked
              ? "확인 항목을 체크하면 넘어갈 수 있어요"
              : "이 화면의 활동을 마치면 넘어갈 수 있어요",
      );
    }
    const frame = requestAnimationFrame(update);
    const observer = new MutationObserver(update);
    observer.observe(lesson, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-pressed", "aria-checked"],
    });
    lesson.addEventListener("input", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      lesson.removeEventListener("input", update);
    };
  }, [buttons]);

  // ←/→ press the lesson's own previous/next buttons (a blocked next stays put).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isIgnoredKey(event) || event.shiftKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (document.querySelector("dialog[open]")) return;
      const { previous, next } = buttons();
      const target = event.key === "ArrowRight" ? next : previous;
      if (!target || target.disabled) return;
      event.preventDefault();
      target.click();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [buttons]);

  async function goBack(to: number) {
    if (!steps) return;
    // Step back one screen at a time with the lesson's own previous button.
    for (let at = steps.current; at > to; at--) {
      const { previous } = buttons();
      if (!previous || previous.disabled) break;
      previous.click();
      await nextFrame();
    }
  }

  function showAction() {
    const lesson = self.current?.closest("section");
    const visible = (selector: string) =>
      Array.from(lesson?.querySelectorAll<HTMLElement>(selector) ?? []).find(
        (element) => !element.closest("aside") && element.getClientRects().length > 0,
      );
    const target =
      visible("button[aria-pressed='false'], [role='radio'][aria-checked='false']") ??
      visible("textarea, input[type='text']") ??
      visible("[data-current-action]");
    target?.scrollIntoView({ block: "center" });
    target?.focus({ preventScroll: true });
  }

  return (
    <>
      <div ref={self} className={system.stepBar}>
        {steps && steps.total > 1 && (
          <>
            <span className={system.stepDots} aria-hidden="true">
              {Array.from({ length: steps.total }, (_, index) => {
                const screen = index + 1;
                return (
                  <button
                    key={screen}
                    type="button"
                    tabIndex={-1}
                    data-state={
                      screen === steps.current
                        ? "current"
                        : screen < steps.current
                          ? "seen"
                          : "next"
                    }
                    disabled={screen >= steps.current}
                    onClick={() => void goBack(screen)}
                  />
                );
              })}
            </span>
            <span className={system.stepCount} aria-label="현재 학습 단계">
              {steps.current} / {steps.total}
            </span>
          </>
        )}
      </div>
      {blocked && (
        <button type="button" data-step-ui className={system.blockedHint} onClick={showAction}>
          {blocked}
        </button>
      )}
    </>
  );
}
