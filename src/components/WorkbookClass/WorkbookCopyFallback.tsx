"use client";

// Client component: when the clipboard is not available, shows the exact text to copy in a
// read-only box and selects it, so the learner copies only what should be pasted.
import { useEffect, useRef } from "react";
import styles from "./WorkbookCopyFallback.module.scss";

export function WorkbookCopyFallback({ text }: { text: string }) {
  const box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    box.current?.focus();
    box.current?.select();
  }, [text]);
  return (
    <label className={styles.fallback}>
      <span>
        자동 복사가 안 됐어요. 아래 글이 골라져 있으니 Ctrl+C(Mac은 ⌘C)로 복사해요. 휴대폰에서는
        길게 눌러 복사하면 돼요.
      </span>
      <textarea
        ref={box}
        readOnly
        value={text}
        rows={Math.min(6, text.split("\n").length + 1)}
        onFocus={(event) => event.currentTarget.select()}
      />
    </label>
  );
}
