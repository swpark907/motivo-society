"use client";
// 필요할 때만 문서 구간을 탐색하고, 프레임의 실제 구간 선택으로 연결한다.
import { useEffect, useId, useRef, useState } from "react";
import type { EditorialOutlineEntry } from "@/lib/editorial/outline";
import styles from "./ArticleEditor.module.scss";
export function SectionNavigator({
  entries,
  activeId,
  onNavigate,
  canvasInteraction,
}: {
  entries: EditorialOutlineEntry[];
  activeId?: string;
  onNavigate: (id: string) => void;
  canvasInteraction: number;
}) {
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const open = openedAt === canvasInteraction;
  const [query, setQuery] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !panel.current?.contains(event.target) &&
        !toggle.current?.contains(event.target)
      )
        setOpenedAt(null);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenedAt(null);
        toggle.current?.focus();
      }
    };
    window.document.addEventListener("pointerdown", outside);
    window.document.addEventListener("keydown", key);
    return () => {
      window.document.removeEventListener("pointerdown", outside);
      window.document.removeEventListener("keydown", key);
    };
  }, [open]);
  const filtered = entries.filter((entry) =>
    `${entry.position} ${entry.label} ${entry.searchText}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <button
        ref={toggle}
        type="button"
        className={styles.readingToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpenedAt(open ? null : canvasInteraction);
          setQuery("");
        }}
      >
        구간 목록
      </button>
      {open && (
        <aside ref={panel} id={panelId} className={styles.outlinePanel} aria-label="구간 목록">
          <header>
            <strong>
              구간 목록 <small>{entries.length - 1}개 · 표지 제외</small>
            </strong>
            <button
              type="button"
              aria-label="구간 목록 닫기"
              onClick={() => {
                setOpenedAt(null);
                toggle.current?.focus();
              }}
            >
              ×
            </button>
          </header>
          <label className={styles.srOnly} htmlFor={`${panelId}-search`}>
            구간 검색
          </label>
          <input
            ref={search}
            id={`${panelId}-search`}
            type="search"
            placeholder="문구·종류로 찾기"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <nav aria-label="글 구간 탐색">
            <ol>
              {filtered.map((entry) => (
                <li key={entry.id} data-depth={entry.depth}>
                  <button
                    type="button"
                    aria-current={activeId === entry.id ? "location" : undefined}
                    onClick={() => {
                      onNavigate(entry.id);
                      setOpenedAt(null);
                    }}
                  >
                    <span>
                      {entry.position}
                      {entry.id !== "@cover" && ` · ${entry.label}`}
                    </span>
                    <strong>{entry.summary || entry.label}</strong>
                  </button>
                </li>
              ))}
            </ol>
            {!filtered.length && <p>일치하는 구간이 없어요. 다른 문구로 찾아보세요.</p>}
          </nav>
        </aside>
      )}
    </>
  );
}
