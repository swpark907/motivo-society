import { useEffect, type RefObject } from "react";

// 모바일 키보드가 layout viewport를 그대로 두는 경우에도 표시 영역 안에 수업을 배치한다.
export function useWorkbookKeyboardViewport(root: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const element = root.current;
    const viewport = window.visualViewport;
    if (!element || !viewport || !active) return;
    let frame = 0;
    let expandedHeight = document.documentElement.clientHeight;
    let layoutWidth = document.documentElement.clientWidth;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const focused = document.activeElement;
        const editing =
          focused instanceof HTMLElement &&
          element.contains(focused) &&
          focused.matches(
            'textarea, input:not([type="checkbox"]):not([type="radio"]), [contenteditable="true"]',
          );
        if (layoutWidth !== document.documentElement.clientWidth) {
          layoutWidth = document.documentElement.clientWidth;
          expandedHeight = document.documentElement.clientHeight;
        }
        if (!editing && element.dataset.keyboardOpen !== "true") {
          expandedHeight = Math.max(expandedHeight, document.documentElement.clientHeight);
        }
        const compact = window.matchMedia("(max-width: 1023px)").matches;
        const reduced = viewport.scale === 1 && viewport.height < expandedHeight * 0.8;
        const open = compact && reduced && (editing || element.dataset.keyboardOpen === "true");
        element.dataset.keyboardOpen = String(open);
        element.style.setProperty("--keyboard-viewport-height", `${viewport.height}px`);
        element.style.setProperty("--keyboard-viewport-top", `${viewport.offsetTop}px`);
        if (open && editing) focused.scrollIntoView({ block: "nearest", behavior: "instant" });
      });
    };
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      delete element.dataset.keyboardOpen;
      element.style.removeProperty("--keyboard-viewport-height");
      element.style.removeProperty("--keyboard-viewport-top");
    };
  }, [root, active]);
}
