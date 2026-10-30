"use client";

import { useEffect, useState, type RefObject } from "react";
import styles from "./WorkbookClass.module.scss";

export function WorkbookActionReturn({
  body,
  enabled = true,
}: {
  body: RefObject<HTMLDivElement | null>;
  enabled?: boolean;
}) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (!enabled || !body.current) return;
    const container = body.current;
    function update() {
      const action = container.querySelector<HTMLElement>("[data-current-action]");
      const bounds = container.getBoundingClientRect();
      const rect = action?.getBoundingClientRect();
      setAvailable(
        !!action?.textContent?.trim() &&
          !!rect &&
          rect.height > 0 &&
          rect.bottom < Math.max(0, bounds.top),
      );
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const resize = new ResizeObserver(update);
    resize.observe(container);
    const mutations = new MutationObserver(update);
    mutations.observe(container, { childList: true, subtree: true, characterData: true });
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [body, enabled]);
  return (
    <>
      {enabled && available && (
        <button
          type="button"
          className={styles.actionReturn}
          data-action-return
          onClick={() => {
            const action = body.current?.querySelector<HTMLElement>("[data-current-action]");
            action?.scrollIntoView({ block: "start", behavior: "instant" });
            action?.focus({ preventScroll: true });
          }}
        >
          현재 안내로 돌아가기 ↑
        </button>
      )}
      <button
        type="button"
        className={styles.keyboardDone}
        onClick={() => {
          const focused = document.activeElement;
          if (focused instanceof HTMLElement && body.current?.contains(focused)) focused.blur();
        }}
      >
        입력 마치기
      </button>
    </>
  );
}
