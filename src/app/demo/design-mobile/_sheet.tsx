"use client";
// 클라이언트인 이유: 열고 닫는 상태 · Escape · 포커스 이동을 다루는 아래 시트(대화상자)다.

import { useEffect, useRef, type ReactNode } from "react";
import s from "./mobile.module.scss";

/**
 * 아래 시트. 지금 모션 규칙(120ms 색·불투명도) 안에서 불투명도로만 나타난다.
 * 아래에서 밀려 올라오는 움직임은 규칙 예외가 필요해 시안에서도 쓰지 않았다.
 * 넓은 화면에서도 휴대폰 틀 안에 뜨도록 <dialog> 모달(브라우저 최상단 층) 대신 앱 틀 안에 그린다.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      (returnTo.current as HTMLElement | null)?.focus?.(); // 연 자리로 포커스를 돌려준다
    };
  }, [open, onClose]);

  return (
    <div className={s.sheetLayer} data-open={open || undefined} aria-hidden={!open}>
      <div className={s.sheetBackdrop} onClick={onClose} />
      <div
        ref={panel}
        className={s.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        inert={!open}
      >
        <div className={s.sheetInner}>
          <div className={s.sheetHandle} aria-hidden="true" />
          <div className={s.sheetHead}>
            <h2>{title}</h2>
            <button type="button" className={s.textBtn} onClick={onClose}>
              닫기
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
