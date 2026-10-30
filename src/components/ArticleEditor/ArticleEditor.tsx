"use client";
// 글과 사진 초안을 브라우저에 임시 저장한다. 미리보기의 선택 도구가 문서 변경을 요청한다.
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import {
  validateEditorialDraft,
  EDITORIAL_PREVIEW_DOCUMENT,
  EDITORIAL_PREVIEW_READY,
  EDITORIAL_PREVIEW_DISMISS,
} from "@/lib/editorial/editor-state";
import { EDITORIAL_PREVIEW_CHANGE } from "@/lib/editorial/selection";
import { getEditorialOutline } from "@/lib/editorial/outline";
import { useEditorAutosave } from "./useEditorAutosave";
import {
  canvasDraftSchema,
  getNewEditorialSeeds,
  type CanvasDraft,
  type DialogDraft,
  type BrowserWorkspace,
} from "@/lib/editorial/browser-draft";
import { DraftList } from "./DraftList";
import { DocumentDialog } from "./DocumentDialog";
import { SectionNavigator } from "./SectionNavigator";
import styles from "./ArticleEditor.module.scss";
type Session = {
  updatedAt: number;
  working: WorkbookReadingDocument;
  valid: WorkbookReadingDocument;
  raw: string;
  rawDirty: boolean;
  errors: string[];
  past: WorkbookReadingDocument[];
  future: WorkbookReadingDocument[];
  exported: string | null;
};
const freshSession = (document: WorkbookReadingDocument): Session => ({
  updatedAt: Date.now(),
  working: structuredClone(document),
  valid: structuredClone(document),
  raw: JSON.stringify(document, null, 2),
  rawDirty: false,
  errors: [],
  past: [],
  future: [],
  exported: null,
});

function PreviewFrame({
  document,
  mobile,
  interactive,
  pendingDraft,
  restoredCanvas,
  onCanvasDraft,
  onCanvasDraftError,
  onUpdate,
  onHistory,
  onDraft,
  revision,
  navigation,
  onSelection,
  onCanvasInteraction,
}: {
  document: WorkbookReadingDocument;
  mobile: boolean;
  interactive: boolean;
  pendingDraft: boolean;
  restoredCanvas: CanvasDraft | null;
  onCanvasDraft: (draft: CanvasDraft) => void;
  onCanvasDraftError: () => void;
  onUpdate: (value: unknown) => void;
  onHistory: (direction: "undo" | "redo") => void;
  onDraft: (value: boolean) => void;
  revision: number;
  navigation: { slug: string; id: string; key: number } | null;
  onSelection: (id: string) => void;
  onCanvasInteraction: () => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [pcWidth, setPcWidth] = useState(1200);
  const width = mobile ? 390 : pcWidth;
  const [compact, setCompact] = useState(false);
  const [{ scale, height }, setViewport] = useState({ scale: 1, height: 560 });
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setCompact(mobile || entry.contentRect.width < 1024);
      const frameWidth = mobile ? 390 : Math.max(1200, entry.contentRect.width);
      if (!mobile) setPcWidth(frameWidth);
      const scale = Math.min(1, entry.contentRect.width / frameWidth);
      if (scale <= 0) return;
      setViewport({ scale, height: entry.contentRect.height / scale });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [mobile]);
  useEffect(() => {
    const send = () =>
      ref.current?.contentWindow?.postMessage(
        {
          type: EDITORIAL_PREVIEW_DOCUMENT,
          document,
          interactive,
          pendingDraft,
          restoredCanvas,
          previewScale: scale,
          compact,
          revision,
        },
        window.location.origin,
      );
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== ref.current?.contentWindow)
        return;
      if (
        event.data?.type === "motivo.editorial.history" &&
        interactive &&
        ["undo", "redo"].includes(event.data.direction)
      )
        onHistory(event.data.direction);
      if (event.data?.type === "motivo.editorial.draft" && event.data.slug === document.slug)
        onDraft(event.data.dirty === true);
      if (event.data?.type === "motivo.editorial.local-drafts") {
        const parsed = canvasDraftSchema.safeParse(event.data.snapshot);
        if (parsed.success) onCanvasDraft(parsed.data);
        else onCanvasDraftError();
      }
      if (event.data?.type === "motivo.editorial.canvas-pointer") onCanvasInteraction();
      if (
        event.data?.type === "motivo.editorial.selection" &&
        event.data.slug === document.slug &&
        typeof event.data.id === "string" &&
        getEditorialOutline(document).some((entry) => entry.id === event.data.id)
      )
        onSelection(event.data.id);
      const data: unknown = event.data;
      if (
        data &&
        typeof data === "object" &&
        "type" in data &&
        data.type === EDITORIAL_PREVIEW_READY
      )
        send();
      if (
        data &&
        typeof data === "object" &&
        "type" in data &&
        data.type === EDITORIAL_PREVIEW_CHANGE &&
        "document" in data &&
        interactive
      )
        onUpdate(data.document);
    };
    const dismiss = (event: PointerEvent) => {
      if (event.target === ref.current) return;
      ref.current?.contentWindow?.postMessage(
        { type: EDITORIAL_PREVIEW_DISMISS },
        window.location.origin,
      );
    };
    window.document.addEventListener("pointerdown", dismiss, true);
    window.addEventListener("message", receive);
    send();
    return () => {
      window.removeEventListener("message", receive);
      window.document.removeEventListener("pointerdown", dismiss, true);
    };
  }, [
    document,
    interactive,
    pendingDraft,
    restoredCanvas,
    onCanvasDraft,
    onCanvasDraftError,
    scale,
    onUpdate,
    compact,
    revision,
    onHistory,
    onDraft,
    onSelection,
    onCanvasInteraction,
  ]);
  useEffect(() => {
    if (navigation?.slug === document.slug)
      ref.current?.contentWindow?.postMessage(
        { type: "motivo.editorial.navigate", slug: document.slug, id: navigation.id },
        window.location.origin,
      );
  }, [navigation, document.slug]);
  return (
    <div ref={container} className={styles.frameContainer}>
      <div className={styles.frameViewport} style={{ width: width * scale }}>
        <iframe
          ref={ref}
          title="아티클 미리보기"
          src="/demo/editorial-preview"
          style={{ width, height, transform: `scale(${scale})` }}
          onLoad={() =>
            ref.current?.contentWindow?.postMessage(
              {
                type: EDITORIAL_PREVIEW_DOCUMENT,
                document,
                interactive,
                pendingDraft,
                restoredCanvas,
                previewScale: scale,
                compact,
                revision,
              },
              window.location.origin,
            )
          }
        />
      </div>
    </div>
  );
}
export function ArticleEditor({ documents }: { documents: WorkbookReadingDocument[] }) {
  const [draftListOpen, setDraftListOpen] = useState(false);
  const [canvasGeneration, setCanvasGeneration] = useState(0);
  const [dialog, setDialog] = useState<"new" | "import" | "info" | null>(null);
  const [canvasStorageError, setCanvasStorageError] = useState("");
  const [canvasDrafts, setCanvasDrafts] = useState<CanvasDraft | null>(null);
  const [restoredCanvas, setRestoredCanvas] = useState<CanvasDraft | null>(null);
  const [dialogDraft, setDialogDraft] = useState<DialogDraft | null>(null);
  const rawId = useId();
  const menuId = useId();
  const bar = useRef<HTMLElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !bar.current?.contains(event.target)) setMoreOpen(false);
    };
    window.document.addEventListener("pointerdown", close);
    return () => window.document.removeEventListener("pointerdown", close);
  }, []);
  const sampleId = useId();
  const [sessions, setSessions] = useState<Record<string, Session>>(() =>
    Object.fromEntries(documents.map((entry) => [entry.slug, freshSession(entry)])),
  );
  const [slug, setSlug] = useState(documents[0].slug);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const [draftDirty, setDraftDirty] = useState(false);
  const [activeSection, setActiveSection] = useState<{ slug: string; id: string } | null>(null);
  const [navigation, setNavigation] = useState<{ slug: string; id: string; key: number } | null>(
    null,
  );
  const [canvasInteraction, setCanvasInteraction] = useState(0);
  const restoreWorkspace = useCallback(
    (saved: BrowserWorkspace) => {
      const added = getNewEditorialSeeds(saved, documents);
      setSessions(
        Object.fromEntries([
          ...added.map((doc) => [doc.slug, freshSession(doc)] as const),
          ...saved.sessions.map((entry) => {
            const session = freshSession(entry.document);
            return [
              entry.document.slug,
              {
                ...session,
                updatedAt: entry.updatedAt ?? 0,
                raw: entry.raw,
                rawDirty: entry.raw !== session.raw,
              },
            ] as const;
          }),
        ]),
      );
      setSlug(
        saved.sessions.some((entry) => entry.document.slug === saved.slug)
          ? saved.slug
          : (added[0]?.slug ?? documents[0].slug),
      );
      setMobile(saved.mobile);
      setCanvasDrafts(saved.canvas);
      setRestoredCanvas(saved.canvas);
      const active = saved.sessions.find((entry) => entry.document.slug === saved.slug);
      setSourceOpen(Boolean(active && active.raw !== JSON.stringify(active.document, null, 2)));
      setDialogDraft(saved.dialog);
      setDialog(saved.dialog?.mode ?? null);
      setActiveSection(saved.canvas?.selection ?? null);
      setMessage("브라우저 임시 저장본을 복원했어요.");
    },
    [documents],
  );
  const storagePayload = useMemo<BrowserWorkspace>(
    () => ({
      version: 1,
      knownSeeds: documents.map((doc) => doc.slug),
      slug,
      mobile,
      sessions: Object.values(sessions).map((entry) => ({
        document: entry.valid,
        raw: entry.raw,
        updatedAt: entry.updatedAt,
      })),
      canvas: canvasDrafts,
      dialog: dialogDraft?.mode === dialog ? dialogDraft : null,
    }),
    [slug, mobile, sessions, canvasDrafts, dialogDraft, dialog, documents],
  );
  const autosave = useEditorAutosave(storagePayload, documents, restoreWorkspace);
  const session = sessions[slug] ?? freshSession(documents[0]);
  const catalog = Object.values(sessions).map((entry) => entry.valid);
  const history = (direction: "undo" | "redo") => {
    if (
      dialog ||
      draftListOpen ||
      session.rawDirty ||
      sourceOpen ||
      draftDirty ||
      session.errors.length
    )
      return;
    const stack = direction === "undo" ? session.past : session.future;
    if (!stack.length) return;
    setSessions((current) => {
      const active = current[slug];
      const source = direction === "undo" ? active.past : active.future;
      if (!source.length) return current;
      const next = source[source.length - 1];
      return {
        ...current,
        [slug]: {
          ...freshSession(next),
          exported: active.exported,
          past: direction === "undo" ? active.past.slice(0, -1) : [...active.past, active.valid],
          future:
            direction === "redo" ? active.future.slice(0, -1) : [...active.future, active.valid],
        },
      };
    });
    setRevision((value) => value + 1);
    setDraftDirty(false);
    setMessage("");
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.key.toLowerCase() !== "z" ||
        (event.target instanceof Element &&
          event.target.closest("input,textarea,select,[contenteditable]"))
      )
        return;
      event.preventDefault();
      history(event.shiftKey ? "redo" : "undo");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const documentState =
    session.rawDirty || draftDirty
      ? "편집 중 · 미적용 내용 있음"
      : session.exported === JSON.stringify(session.valid)
        ? "내보냄 · 서버 저장 아님"
        : JSON.stringify(session.valid) !==
            JSON.stringify(documents.find((entry) => entry.slug === slug))
          ? "문서에 반영됨 · 파일 보관 필요"
          : "샘플 원본 · 변경 없음";
  const pending = session.rawDirty || session.errors.length > 0;
  const apply = (value: unknown) => {
    const result = validateEditorialDraft(value, catalog, slug, documents);
    if (result.ok)
      setSessions((current) => {
        const active = current[slug];
        if (JSON.stringify(active.valid) === JSON.stringify(result.document))
          return {
            ...current,
            [slug]: {
              ...active,
              raw: JSON.stringify(result.document, null, 2),
              rawDirty: false,
              errors: [],
            },
          };
        return {
          ...current,
          [slug]: {
            ...freshSession(result.document),
            past: [...active.past, active.valid].slice(-100),
            exported: active.exported,
          },
        };
      });
    else
      setSessions((current) => ({
        ...current,
        [slug]: { ...current[slug], errors: result.errors },
      }));
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(session.valid, null, 2)], { type: "application/json" }),
    );
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSessions((current) => ({
      ...current,
      [slug]: { ...current[slug], exported: JSON.stringify(current[slug].valid) },
    }));
    setMessage("JSON 파일로 내보냈어요. 서버에는 저장하지 않습니다.");
  };
  if (!autosave.ready)
    return (
      <main className={styles.editor}>
        <p role="status">브라우저에 임시 저장한 글을 불러오는 중이에요.</p>
      </main>
    );
  return (
    <main className={styles.editor} data-article-editor>
      {dialog && (
        <DocumentDialog
          key={`${dialog}:${slug}`}
          mode={dialog}
          document={session.valid}
          documents={catalog}
          trustedDocuments={documents}
          initialDraft={dialogDraft?.mode === dialog ? dialogDraft : null}
          onDraft={(draft) => setDialogDraft(draft)}
          onClose={() => {
            setDialog(null);
            setDialogDraft(null);
          }}
          onApply={(next) => {
            if (dialog === "info") apply(next);
            else {
              setSessions((current) => ({ ...current, [next.slug]: freshSession(next) }));
              setSlug(next.slug);
              setSourceOpen(false);
              setReading(false);
              setDraftDirty(false);
            }
            setDialog(null);
            setDialogDraft(null);
            setMessage("글을 편집기에 열었어요. 변경 내용은 브라우저에 자동 임시 저장됩니다.");
          }}
        />
      )}
      {draftListOpen && (
        <DraftList
          sessions={Object.values(sessions).map((entry) => ({
            document: entry.valid,
            updatedAt: entry.updatedAt,
          }))}
          currentSlug={slug}
          onClose={() => setDraftListOpen(false)}
          onSelect={(next) => {
            setSlug(next);
            setSourceOpen(sessions[next].rawDirty);
            setDraftDirty(false);
            setDraftListOpen(false);
            setMessage("");
          }}
          onDelete={(target) => {
            const linked = Object.values(sessions).filter((entry) =>
              entry.valid.related.some((item) => item.slug === target),
            );
            if (linked.some((entry) => entry.rawDirty))
              return "연결된 글의 JSON 수정을 먼저 적용하거나 취소해주세요.";
            const remaining = Object.fromEntries(
              Object.entries(sessions)
                .filter(([key]) => key !== target)
                .map(([key, entry]) => {
                  if (!entry.valid.related.some((item) => item.slug === target))
                    return [key, { ...entry, past: [], future: [] }];
                  return [
                    key,
                    freshSession({
                      ...entry.valid,
                      related: entry.valid.related.filter((item) => item.slug !== target),
                    }),
                  ];
                }),
            );
            setSessions(remaining);
            const cleaned = canvasDrafts
              ? {
                  ...canvasDrafts,
                  texts: canvasDrafts.texts.filter(([key]) => !key.startsWith(`${target}:`)),
                  blocks: canvasDrafts.blocks.filter(([key]) => !key.startsWith(`${target}:`)),
                  covers: canvasDrafts.covers.filter(([key]) => key !== target),
                  selection:
                    canvasDrafts.selection?.slug === target ? null : canvasDrafts.selection,
                  editing: canvasDrafts.editing?.slug === target ? null : canvasDrafts.editing,
                  contentEdit:
                    canvasDrafts.contentEdit?.slug === target ? null : canvasDrafts.contentEdit,
                  coverPhoto:
                    canvasDrafts.coverPhoto?.slug === target ? null : canvasDrafts.coverPhoto,
                  conversion:
                    canvasDrafts.conversion?.slug === target ? null : canvasDrafts.conversion,
                  text: canvasDrafts.selection?.slug === target ? null : canvasDrafts.text,
                }
              : null;
            setCanvasDrafts(cleaned);
            setRestoredCanvas(cleaned);
            setCanvasGeneration((value) => value + 1);
            if (slug === target) {
              const nextSlug = Object.keys(remaining)[0] ?? documents[0].slug;
              setSlug(nextSlug);
              setSourceOpen(remaining[nextSlug]?.rawDirty ?? false);
              setDraftDirty(false);
              setActiveSection(null);
            }
            setMessage("초안을 삭제했어요. 업로드한 사진은 사진 목록에 남아 있어요.");
            return null;
          }}
        />
      )}
      <h1 className={styles.srOnly}>아티클 편집기</h1>
      <header
        ref={bar}
        className={styles.bar}
        role="toolbar"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setMoreOpen(false);
        }}
        aria-label="아티클 편집 도구"
        onKeyDown={(event) => {
          if (event.key === "Escape") setMoreOpen(false);
        }}
      >
        <Link className={styles.back} href="/demo/admin" aria-label="관리자 설계로 돌아가기">
          ←<span> 관리자</span>
        </Link>
        <label className={styles.srOnly} htmlFor={sampleId}>
          샘플 글
        </label>
        <select
          disabled={!catalog.length}
          id={sampleId}
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setDraftDirty(false);
            setSourceOpen(sessions[event.target.value].rawDirty);
            setMessage("");
            setMoreOpen(false);
          }}
        >
          {catalog.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.title}
            </option>
          ))}
        </select>
        <div className={styles.screens}>
          <button aria-label="PC 1200" aria-pressed={!mobile} onClick={() => setMobile(false)}>
            PC
          </button>
          <button aria-label="모바일 390" aria-pressed={mobile} onClick={() => setMobile(true)}>
            모바일
          </button>
        </div>
        <div className={styles.history}>
          <button
            aria-label="실행 취소"
            title="실행 취소 (Ctrl/Cmd+Z)"
            disabled={!session.past.length || pending || sourceOpen || draftDirty}
            onClick={() => history("undo")}
          >
            ↶
          </button>
          <button
            aria-label="다시 실행"
            title="다시 실행 (Ctrl/Cmd+Shift+Z)"
            disabled={!session.future.length || pending || sourceOpen || draftDirty}
            onClick={() => history("redo")}
          >
            ↷
          </button>
        </div>
        <span className={styles.badge} title="이 브라우저에 자동 임시 저장됩니다.">
          테스트
        </span>
        <div className={styles.overflow} data-open={moreOpen} id={menuId}>
          <div className={styles.actions}>
            <button
              onClick={() => {
                setDraftListOpen(true);
                setMoreOpen(false);
              }}
            >
              임시 저장 목록
            </button>
            <button
              onClick={() => {
                setDialogDraft(null);
                setDialog("new");
                setMoreOpen(false);
              }}
            >
              새 글
            </button>
            <button
              onClick={() => {
                setDialogDraft(null);
                setDialog("import");
                setMoreOpen(false);
              }}
            >
              JSON 불러오기
            </button>
            <button
              disabled={!catalog.length || pending || draftDirty}
              onClick={() => {
                setDialogDraft(null);
                setDialog("info");
                setMoreOpen(false);
              }}
            >
              글 기본정보
            </button>
            <button
              disabled={!catalog.length}
              aria-expanded={sourceOpen}
              onClick={() => {
                if (sourceOpen && session.rawDirty) {
                  setMessage("원문의 변경을 먼저 적용하거나 취소해주세요.");
                  return;
                }
                setReading(false);
                setSourceOpen(!sourceOpen);
                setMoreOpen(false);
              }}
            >
              원문 편집
            </button>
            <button
              disabled={!catalog.length || pending || draftDirty}
              onClick={() => {
                download();
                setMoreOpen(false);
              }}
            >
              JSON 내보내기 ↗
            </button>
          </div>
          <div className={styles.secondary}>
            <button
              onClick={() => {
                setMoreOpen(false);
                apply(documents.find((entry) => entry.slug === slug) ?? session.valid);
                setRevision((value) => value + 1);
                setDraftDirty(false);
                setMessage("샘플을 원래대로 되돌렸어요.");
              }}
              disabled={!catalog.length || !documents.some((entry) => entry.slug === slug)}
            >
              샘플 초기화
            </button>
            <Link href="/workbook">워크북으로 ↗</Link>
            <p>구간 클릭으로 편집 · + 버튼으로 추가</p>
            <p>이 브라우저에 자동 임시 저장됩니다.</p>
          </div>
        </div>
        <button
          className={styles.more}
          aria-label="편집 도구 더보기"
          aria-expanded={moreOpen}
          aria-controls={menuId}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          ⋯
        </button>
      </header>
      <div className={styles.documentState}>
        <span role="status" aria-label="자동 임시 저장 상태">
          {canvasStorageError || autosave.status}
        </span>
        <span role="status">{catalog.length ? documentState : "저장한 글 없음"}</span>
        {catalog.length > 0 && (
          <SectionNavigator
            key={slug}
            entries={getEditorialOutline(session.valid)}
            activeId={activeSection?.slug === slug ? activeSection.id : undefined}
            canvasInteraction={canvasInteraction}
            onNavigate={(id) => setNavigation({ slug, id, key: performance.now() })}
          />
        )}
        <button
          type="button"
          className={styles.readingToggle}
          aria-label="읽기 화면"
          aria-pressed={reading}
          disabled={!catalog.length || sourceOpen || pending}
          onClick={() => setReading(!reading)}
        >
          {reading ? "편집으로 돌아가기" : "읽기 화면"}
        </button>
        <span>
          {reading
            ? "마지막으로 적용한 글을 편집 표시 없이 보고 있어요."
            : draftDirty
              ? "미적용 내용은 구간을 다시 선택해 적용하거나 취소해주세요."
              : "이 브라우저에 자동 임시 저장됩니다."}
        </span>
      </div>
      {sourceOpen && (
        <section className={styles.source} aria-label="문서 편집">
          <label htmlFor={rawId}>에디토리얼 JSON</label>
          <textarea
            id={rawId}
            rows={18}
            spellCheck={false}
            value={session.raw}
            onChange={(event) => {
              const raw = event.target.value;
              setSessions((current) => ({
                ...current,
                [slug]: {
                  ...current[slug],
                  raw,
                  updatedAt: Date.now(),
                  rawDirty: raw !== JSON.stringify(current[slug].valid, null, 2),
                  errors: [],
                },
              }));
            }}
          />
          <div className={styles.toolbar}>
            <button
              onClick={() => {
                try {
                  apply(JSON.parse(session.raw));
                } catch {
                  setSessions((current) => ({
                    ...current,
                    [slug]: { ...current[slug], errors: ["JSON 문법을 확인해주세요."] },
                  }));
                }
              }}
            >
              JSON 적용
            </button>
            <button
              onClick={() =>
                setSessions((current) => ({
                  ...current,
                  [slug]: {
                    ...current[slug],
                    raw: JSON.stringify(current[slug].valid, null, 2),
                    rawDirty: false,
                    errors: [],
                  },
                }))
              }
            >
              원문 변경 취소
            </button>
          </div>
          {session.errors.length > 0 && (
            <div role="alert">
              적용 전에 확인해주세요.
              <ul>
                {session.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      <p className={message || pending ? styles.status : styles.srOnly} role="status">
        {message || (pending ? "미적용 원문이 있어요. 마지막 유효 문서를 표시합니다." : "")}
      </p>
      {!catalog.length ? (
        <section className={styles.emptyDrafts}>
          <h2>아직 저장한 글이 없어요.</h2>
          <p>새 글을 쓰거나 JSON 파일을 불러와 시작해보세요.</p>
          <button
            onClick={() => {
              setDialogDraft(null);
              setDialog("new");
            }}
          >
            새 글 작성
          </button>
          <button
            onClick={() => {
              setDialogDraft(null);
              setDialog("import");
            }}
          >
            JSON 불러오기
          </button>
        </section>
      ) : (
        <section className={styles.preview} aria-label="실시간 미리보기">
          <PreviewFrame
            key={canvasGeneration}
            document={session.valid}
            mobile={mobile}
            interactive={!reading && !sourceOpen && !pending}
            pendingDraft={draftDirty}
            restoredCanvas={restoredCanvas}
            onCanvasDraft={(draft) => {
              setCanvasStorageError("");
              const content = (value: CanvasDraft | null) =>
                JSON.stringify(
                  value && [
                    value.texts,
                    value.blocks,
                    value.covers,
                    value.text,
                    value.contentEdit,
                    value.coverPhoto,
                    value.conversion,
                  ],
                );
              if (content(draft) !== content(canvasDrafts))
                setSessions((current) =>
                  current[slug]
                    ? { ...current, [slug]: { ...current[slug], updatedAt: Date.now() } }
                    : current,
                );
              setCanvasDrafts(draft);
            }}
            onCanvasDraftError={() =>
              setCanvasStorageError(
                "미적용 내용의 임시 저장에 실패했어요. 내용을 확인하고 JSON으로 보관해주세요.",
              )
            }
            onUpdate={apply}
            onHistory={history}
            onDraft={setDraftDirty}
            revision={revision}
            navigation={navigation}
            onSelection={(id) =>
              setActiveSection((current) =>
                current?.slug === slug && current.id === id ? current : { slug, id },
              )
            }
            onCanvasInteraction={() => setCanvasInteraction((value) => value + 1)}
          />
        </section>
      )}
    </main>
  );
}
