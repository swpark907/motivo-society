"use client";

// 같은 출처의 부모 편집기에서 검증된 문서만 받아 공통 렌더러로 표시한다.
import { useCallback, useEffect, useMemo, useId, useRef, useState } from "react";
import { ReadingBlockPreview } from "@/components/EditorialArticle/EditorialBlocks";
import { EditorialArticle } from "@/components/EditorialArticle/EditorialArticle";
import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import {
  EDITORIAL_PREVIEW_DOCUMENT,
  EDITORIAL_PREVIEW_READY,
  EDITORIAL_PREVIEW_DISMISS,
  validateEditorialDraft,
} from "@/lib/editorial/editor-state";
import {
  EDITORIAL_PREVIEW_CHANGE,
  BLOCK_LABELS,
  findEditorialBlock,
  getSelectionGroups,
  applySelectionOption,
  getSelectionText,
  applySelectionText,
} from "@/lib/editorial/selection";
import {
  convertEditorialBlock,
  replaceEditorialBlock,
  getConversionIssue,
} from "@/lib/editorial/block-conversion";
import {
  workbookReadingSchema,
  editorialBlockSchema,
} from "@/lib/content/workbook-editorial-schema";
import {
  StructuredContentFields,
  isStructuredBlock,
  type StructuredBlock,
} from "./StructuredContentFields";
import type { EditorialBlock } from "@/lib/content/workbook-editorial-schema";
import { ContentWorkspace, type ContentWorkspaceHandle } from "./ContentWorkspace";
import {
  getEditorialPhotos,
  getEditorialPhoto,
  applyEditorialPhoto,
  type PhotoSelection,
  type EditorialPhoto,
} from "@/lib/editorial/photos";
import { PhotoPicker } from "./PhotoPicker";
import { InlineBlockTools } from "./InlineBlockTools";
import { LayoutMiniature } from "./LayoutMiniature";
import {
  getBlockOperationReasons,
  operateEditorialBlock,
  type BlockOperation,
} from "@/lib/editorial/block-operations";
import { insertEditorialBlock } from "@/lib/editorial/block-insertion";
import { getEditorialOutline } from "@/lib/editorial/outline";
import {
  getBlockInputFeedback,
  type InputFeedbackItem,
  getSelectionInputMessages,
} from "@/lib/editorial/input-feedback";
import { canvasDraftSchema } from "@/lib/editorial/browser-draft";
import { InputFeedback } from "./InputFeedback";
import styles from "./EditorialPreview.module.scss";

export function EditorialPreview({ documents }: { documents: WorkbookReadingDocument[] }) {
  const restoredLocalDrafts = useRef(false);
  const lastLocalSnapshot = useRef("");
  const suppliedPhotos = useMemo(() => getEditorialPhotos(documents), [documents]);
  const [uploadedPhotos, setUploadedPhotos] = useState<EditorialPhoto[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<{ slug: string; value: PhotoSelection } | null>(
    null,
  );
  const coverPhotoDrafts = useRef(new Map<string, PhotoSelection>());
  const feedbackId = useId();
  const workspace = useRef<ContentWorkspaceHandle>(null);
  const jumpToInput = (key: string) => workspace.current?.focusField(key);
  const [document, setDocument] = useState<WorkbookReadingDocument | null>(null);
  const photos = useMemo(
    () => [
      ...new Map(
        [
          ...suppliedPhotos,
          ...(document
            ? getEditorialPhotos([document]).filter((photo) => photo.src.startsWith("data:"))
            : []),
          ...uploadedPhotos,
        ].map((photo) => [photo.src, photo]),
      ).values(),
    ],
    [suppliedPhotos, uploadedPhotos, document],
  );
  const addPhoto = (photo: EditorialPhoto) =>
    setUploadedPhotos((current) =>
      current.some((entry) => entry.src === photo.src) ? current : [...current, photo],
    );
  const canvas = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [interactive, setInteractive] = useState(false);
  const [selection, setSelection] = useState<{ slug: string; id: string } | null>(null);
  const [editingSelection, setEditingSelection] = useState<{ slug: string; id: string } | null>(
    null,
  );
  const textInput = useRef<HTMLTextAreaElement>(null);
  const [blocked, setBlocked] = useState<{
    slug: string;
    id: string;
    type: EditorialBlock["type"];
  } | null>(null);
  const [contentEdit, setContentEdit] = useState<{
    slug: string;
    id: string;
    block: EditorialBlock;
  } | null>(null);
  const contentDrafts = useRef(new Map<string, EditorialBlock>());
  const [conversionEditing, setConversionEditing] = useState(false);
  const [kindsOpen, setKindsOpen] = useState(false);
  const backToKinds = useRef<HTMLButtonElement>(null);
  const [conversion, setConversion] = useState<{
    slug: string;
    id: string;
    type: EditorialBlock["type"];
    input?: string;
    override?: StructuredBlock;
  } | null>(null);
  const [insertion, setInsertion] = useState<{ slug: string; afterId: string | null } | null>(null);
  const [text, setText] = useState<string | null>(null);
  const drafts = useRef(new Map<string, string>());
  const [error, setError] = useState("");
  const [pendingBlockEdits, setPendingBlockEdits] = useState(false);
  const [operationNotice, setOperationNotice] = useState("");
  const [operationTarget, setOperationTarget] = useState<{ id: string; key: number } | null>(null);
  useEffect(() => {
    if (!operationTarget) return;
    const element = window.document.getElementById(operationTarget.id);
    element?.scrollIntoView({ block: "center", behavior: "instant" });
    element?.focus({ preventScroll: true });
  }, [operationTarget]);
  const revision = useRef(0);
  useEffect(() => {
    if (!document) return;
    const prefix = `${document.slug}:`;
    if (selection?.slug === document.slug && text !== null)
      drafts.current.set(`${document.slug}:${selection.id}`, text);
    for (const [key, value] of drafts.current) {
      if (key.startsWith(prefix) && value === getSelectionText(document, key.slice(prefix.length)))
        drafts.current.delete(key);
    }
    for (const [key, value] of contentDrafts.current) {
      if (
        key.startsWith(prefix) &&
        JSON.stringify(value) ===
          JSON.stringify(findEditorialBlock(document, key.slice(prefix.length)))
      )
        contentDrafts.current.delete(key);
    }
    if (coverPhoto?.slug === document.slug)
      coverPhotoDrafts.current.set(document.slug, coverPhoto.value);
    if (
      JSON.stringify(coverPhotoDrafts.current.get(document.slug)) ===
      JSON.stringify(getEditorialPhoto(document, "@cover"))
    )
      coverPhotoDrafts.current.delete(document.slug);
    const dirty =
      coverPhotoDrafts.current.has(document.slug) ||
      (contentEdit?.slug === document.slug &&
        JSON.stringify(contentEdit.block) !==
          JSON.stringify(findEditorialBlock(document, contentEdit.id))) ||
      conversion?.slug === document.slug ||
      [...drafts.current.keys(), ...contentDrafts.current.keys()].some((key) =>
        key.startsWith(prefix),
      );
    window.parent.postMessage(
      { type: "motivo.editorial.draft", slug: document.slug, dirty },
      window.location.origin,
    );
    const snapshot = {
      version: 1,
      texts: [...drafts.current],
      blocks: [...contentDrafts.current],
      covers: [...coverPhotoDrafts.current],
      photos: uploadedPhotos,
      selection,
      editing: editingSelection,
      text,
      contentEdit,
      coverPhoto,
      conversion,
    };
    const serialized = JSON.stringify(snapshot);
    if (serialized !== lastLocalSnapshot.current) {
      lastLocalSnapshot.current = serialized;
      window.parent.postMessage(
        { type: "motivo.editorial.local-drafts", snapshot },
        window.location.origin,
      );
    }
  }, [
    document,
    text,
    contentEdit,
    conversion,
    selection,
    coverPhoto,
    uploadedPhotos,
    editingSelection,
  ]);
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
      window.parent.postMessage(
        { type: "motivo.editorial.history", direction: event.shiftKey ? "redo" : "undo" },
        window.location.origin,
      );
    };
    window.document.addEventListener("keydown", key);
    return () => window.document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      const data: unknown = event.data;
      if (
        !data ||
        typeof data !== "object" ||
        !("type" in data) ||
        data.type !== EDITORIAL_PREVIEW_DOCUMENT ||
        !("document" in data)
      )
        return;
      const incoming = data.document;
      if (
        !incoming ||
        typeof incoming !== "object" ||
        !("slug" in incoming) ||
        typeof incoming.slug !== "string"
      )
        return;
      const result = validateEditorialDraft(incoming, documents, incoming.slug, documents, true);
      if (result.ok) {
        if (!restoredLocalDrafts.current) {
          restoredLocalDrafts.current = true;
          const saved = canvasDraftSchema.safeParse(
            "restoredCanvas" in data ? data.restoredCanvas : null,
          );
          if (saved.success) {
            drafts.current = new Map(saved.data.texts);
            contentDrafts.current = new Map(saved.data.blocks);
            coverPhotoDrafts.current = new Map(saved.data.covers);
            setUploadedPhotos(saved.data.photos);
            setSelection(saved.data.selection);
            setEditingSelection(saved.data.editing);
            setText(saved.data.text);
            setContentEdit(saved.data.contentEdit);
            setCoverPhoto(saved.data.coverPhoto);
            setConversion(saved.data.conversion);
          }
        }
        if (
          "revision" in data &&
          typeof data.revision === "number" &&
          data.revision !== revision.current
        ) {
          revision.current = data.revision;
          const prefix = `${result.document.slug}:`;
          for (const key of drafts.current.keys())
            if (key.startsWith(prefix)) drafts.current.delete(key);
          for (const key of contentDrafts.current.keys())
            if (key.startsWith(prefix)) contentDrafts.current.delete(key);
          coverPhotoDrafts.current.delete(result.document.slug);
          setCoverPhoto(null);
          setText(null);
          setContentEdit(null);
          setConversion(null);
          setSelection(null);
          setEditingSelection(null);
          setOperationNotice("");

          setInsertion(null);
        }
        setDocument(result.document);
        setInteractive("interactive" in data && data.interactive === true);
        setPendingBlockEdits("pendingDraft" in data && data.pendingDraft === true);
        setCompact("compact" in data && data.compact === true);
        if (
          "previewScale" in data &&
          typeof data.previewScale === "number" &&
          data.previewScale > 0 &&
          data.previewScale <= 1
        )
          setPreviewScale(data.previewScale);
        setError("");
      } else setError("문서 형식이 맞지 않아 마지막 미리보기를 유지합니다.");
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: EDITORIAL_PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, [documents]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [document?.slug]);
  const id =
    selection &&
    document &&
    selection.slug === document.slug &&
    (selection.id === "@cover" || findEditorialBlock(document, selection.id))
      ? selection.id
      : undefined;
  const editorOpen = Boolean(
    document && id && editingSelection?.slug === document.slug && editingSelection.id === id,
  );
  const confirmation =
    conversion && document && conversion.slug === document.slug && conversion.id === id
      ? conversion
      : null;
  const blockedIssue =
    blocked && document && blocked.slug === document.slug && blocked.id === id
      ? getConversionIssue(document, id, blocked.type)
      : null;
  const editingContent =
    contentEdit && document && contentEdit.slug === document.slug && contentEdit.id === id
      ? contentEdit
      : null;
  const conversionCandidate = useMemo(() => {
    if (!confirmation || !document || !id) return null;
    const source =
      confirmation.input === undefined
        ? document
        : applySelectionText(document, id, confirmation.input);
    if (getConversionIssue(source, id, confirmation.type)) return null;
    const next = convertEditorialBlock(source, id, confirmation.type);
    return confirmation.override ? replaceEditorialBlock(next, confirmation.override) : next;
  }, [confirmation, document, id]);
  const conversionDraft = useMemo(() => {
    if (!conversionCandidate) return null;
    const result = workbookReadingSchema.safeParse(conversionCandidate);
    return result.success ? result.data : null;
  }, [conversionCandidate]);
  const convertedBlock =
    conversionCandidate && id ? findEditorialBlock(conversionCandidate, id) : null;
  const needsSplit = confirmation?.input !== undefined;
  const confirmationKey = confirmation
    ? `${confirmation.slug}:${confirmation.id}:${confirmation.type}`
    : "";
  const editingCoverPhoto =
    document && id === "@cover" && coverPhoto?.slug === document.slug ? coverPhoto.value : null;
  const photoCandidate =
    document && editingCoverPhoto
      ? applyEditorialPhoto(document, "@cover", editingCoverPhoto)
      : null;
  const photoFeedback: InputFeedbackItem[] = editingCoverPhoto
    ? [
        ...(!editingCoverPhoto.alt.trim()
          ? [{ message: "사진 설명을 입력해주세요.", fieldKey: "photo-alt" }]
          : []),
        ...(!editingCoverPhoto.caption.trim()
          ? [{ message: "사진 캡션을 입력해주세요.", fieldKey: "photo-caption" }]
          : []),
      ]
    : [];
  const wideEditing = Boolean(
    editingCoverPhoto ||
    text !== null ||
    editingContent ||
    (confirmation && (needsSplit || conversionEditing)),
  );
  const editedContentDocument =
    editingContent && document && editorialBlockSchema.safeParse(editingContent.block).success
      ? replaceEditorialBlock(document, editingContent.block)
      : null;
  const textCandidate =
    document && id && text !== null ? applySelectionText(document, id, text) : null;
  const textFeedback: InputFeedbackItem[] =
    textCandidate && id
      ? getSelectionInputMessages(textCandidate, id).map((message) => ({
          message,
          fieldKey: "selection-text",
        }))
      : [];
  const textMessages = textFeedback.map((item) => item.message);
  const contentFeedback = editingContent ? getBlockInputFeedback(editingContent.block) : [];
  const contentMessages = contentFeedback.map((item) => item.message);
  const conversionFeedback: InputFeedbackItem[] = convertedBlock
    ? getBlockInputFeedback(convertedBlock)
    : confirmation && !conversionDraft
      ? [
          {
            message:
              confirmation.type === "qa"
                ? "나눌 내용에 질문과 답변을 적고, 사이에 빈 줄을 넣어주세요."
                : "나눌 내용에 두 내용을 적고, 사이에 빈 줄을 넣어주세요.",
            fieldKey: "conversion-text",
          },
        ]
      : [];
  const helpCode = blockedIssue?.code;
  useEffect(() => {
    if (confirmationKey && needsSplit) textInput.current?.focus({ preventScroll: true });
    else if (confirmationKey || helpCode) backToKinds.current?.focus({ preventScroll: true });
  }, [confirmationKey, needsSplit, helpCode]);
  const closePopup = useCallback(() => {
    if (document && id && text !== null) drafts.current.set(`${document.slug}:${id}`, text);
    setEditingSelection(null);
    setCoverPhoto(null);
    setInsertion(null);
    setConversion(null);
    setConversionEditing(false);
    setBlocked(null);
    setContentEdit(null);
    setText(null);
    setError("");
  }, [document, id, text]);
  const closeEditor = () => {
    closePopup();
    requestAnimationFrame(() =>
      canvas.current
        ?.querySelector<HTMLButtonElement>('[data-inline-block-tools] [aria-label="구간 편집"]')
        ?.focus(),
    );
  };
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest("[data-editor-tools], [data-block-type], [data-cover-layout]")
      )
        closePopup();
    };
    const dismiss = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === window.parent &&
        event.data?.type === EDITORIAL_PREVIEW_DISMISS
      )
        closePopup();
    };
    window.document.addEventListener("pointerdown", outside, true);
    window.addEventListener("message", dismiss);
    return () => {
      window.document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("message", dismiss);
    };
  }, [closePopup]);
  useEffect(() => {
    canvas.current
      ?.querySelectorAll<HTMLElement>("[data-block-type], [data-cover-layout]")
      .forEach((element) => {
        element.tabIndex = interactive ? 0 : -1;
        element.dataset.editorSelected = String(interactive && (element.id || "@cover") === id);
      });
  }, [document, id, interactive]);
  const commit = (next: WorkbookReadingDocument) => {
    const result = validateEditorialDraft(next, documents, next.slug, documents, true);
    if (!result.ok) {
      setError(result.errors.join(" · "));
      return false;
    }
    setDocument(result.document);
    setError("");
    window.parent.postMessage(
      { type: EDITORIAL_PREVIEW_CHANGE, document: result.document },
      window.location.origin,
    );
    return true;
  };
  const select = useCallback(
    (target: EventTarget) => {
      if (!interactive || !(target instanceof Element) || target.closest("[data-editor-tools]"))
        return;
      const element = target.closest<HTMLElement>("[data-block-type], [data-cover-layout]");
      if (element && document) {
        const nextId = element.id || "@cover";
        if (nextId === id) return;
        setEditingSelection(null);
        setCoverPhoto(null);
        setOperationNotice("");
        if (id && text !== null) drafts.current.set(`${document.slug}:${id}`, text);
        setInsertion(null);
        setBlocked(null);
        setContentEdit(
          contentDrafts.current.has(`${document.slug}:${nextId}`)
            ? {
                slug: document.slug,
                id: nextId,
                block: contentDrafts.current.get(`${document.slug}:${nextId}`)!,
              }
            : null,
        );
        setKindsOpen(false);
        setSelection({ slug: document.slug, id: element.id || "@cover" });
        setText(drafts.current.get(`${document.slug}:${nextId}`) ?? null);
        setConversion(null);
        setConversionEditing(false);
        setError("");
      }
    },
    [interactive, document, id, text],
  );
  useEffect(() => {
    const navigate = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== "motivo.editorial.navigate" ||
        event.data.slug !== document?.slug ||
        typeof event.data.id !== "string"
      )
        return;
      if (!document || !getEditorialOutline(document).some((entry) => entry.id === event.data.id))
        return;
      const element =
        event.data.id === "@cover"
          ? canvas.current?.querySelector<HTMLElement>("[data-cover-layout]")
          : window.document.getElementById(event.data.id);
      if (!element) return;
      element.scrollIntoView({ block: "start", behavior: "instant" });
      if (interactive) select(element);
      element.focus({ preventScroll: true });
    };
    window.addEventListener("message", navigate);
    return () => window.removeEventListener("message", navigate);
  }, [document, interactive, select]);
  useEffect(() => {
    if (document && id)
      window.parent.postMessage(
        { type: "motivo.editorial.selection", slug: document.slug, id },
        window.location.origin,
      );
  }, [document, id]);
  useEffect(() => {
    const pointer = () =>
      window.parent.postMessage(
        { type: "motivo.editorial.canvas-pointer" },
        window.location.origin,
      );
    window.document.addEventListener("pointerdown", pointer, true);
    return () => window.document.removeEventListener("pointerdown", pointer, true);
  }, []);
  const applyText = () => {
    if (!document || !id || text === null) return;
    const next = applySelectionText(document, id, text);
    if (commit(next)) {
      drafts.current.delete(`${document.slug}:${id}`);
      setText(null);
    }
  };
  const operationReasons = document && id ? getBlockOperationReasons(document, id) : null;
  const operate = (operation: BlockOperation) => {
    if (!document || !id || pendingBlockEdits) return;
    const hasDraft =
      document &&
      ([...drafts.current].some(
        ([key, value]) =>
          key.startsWith(`${document.slug}:`) &&
          value !== getSelectionText(document, key.slice(document.slug.length + 1)),
      ) ||
        [...contentDrafts.current].some(
          ([key, value]) =>
            key.startsWith(`${document.slug}:`) &&
            JSON.stringify(value) !==
              JSON.stringify(findEditorialBlock(document, key.slice(document.slug.length + 1))),
        ));
    if (hasDraft || coverPhotoDrafts.current.has(document.slug)) {
      setError("미적용 내용을 먼저 적용하거나 취소해주세요.");
      return;
    }
    try {
      const next = operateEditorialBlock(
        document,
        id,
        operation,
        () => `block-${crypto.randomUUID()}`,
      );
      if (!commit(next.document)) return;
      setSelection({ slug: document.slug, id: next.id });
      setEditingSelection(null);
      setText(null);
      setContentEdit(null);
      setConversion(null);
      setKindsOpen(false);
      setBlocked(null);
      setOperationTarget((previous) => ({ id: next.id, key: (previous?.key ?? 0) + 1 }));
      setOperationNotice(
        `${operation === "duplicate" ? "복제한 구간을 선택했어요." : operation === "delete" ? "구간을 삭제했어요." : "구간 순서를 바꿨어요."} 상단에서 실행 취소할 수 있어요.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "구간을 변경하지 못했어요.");
    }
  };
  const currentSection =
    document && id ? getEditorialOutline(document).find((entry) => entry.id === id) : null;
  const sectionPosition = currentSection
    ? currentSection.id === "@cover"
      ? "표지"
      : `${currentSection.position} · ${currentSection.label}`
    : "";
  const groups = document && id ? getSelectionGroups(document, id) : [];
  const groupButtons = (advanced: boolean) =>
    groups
      .filter((group) => Boolean(group.advanced) === advanced)
      .map((group) => (
        <div className={styles.group} key={group.key}>
          <span>{group.label}</span>
          <div>
            {group.options.map(([value, label]) => (
              <button
                key={value}
                className={styles.option}
                aria-pressed={group.value === value}
                onClick={() =>
                  document && id && commit(applySelectionOption(document, id, group.key, value))
                }
              >
                <LayoutMiniature
                  kind={
                    group.key === "layout"
                      ? id === "@cover"
                        ? "cover"
                        : findEditorialBlock(document!, id!)!.type
                      : group.key === "tone"
                        ? "text"
                        : group.key
                  }
                  value={value}
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      ));
  return (
    <main
      ref={canvas}
      className={styles.canvas}
      data-interactive={interactive}
      onClickCapture={(event) => {
        if (event.target instanceof Element) {
          const anchor = event.target.closest("a");
          if (anchor && !anchor.getAttribute("href")?.startsWith("#")) event.preventDefault();
        }
        select(event.target);
      }}
      onKeyDown={(event) => {
        if (
          (event.key === "Enter" || event.key === " ") &&
          event.target instanceof Element &&
          !event.target.closest("[data-editor-tools]") &&
          event.target.matches("[data-block-type], [data-cover-layout]")
        ) {
          event.preventDefault();
          select(event.target);
        }
      }}
    >
      {error && !id && !insertion && <p role="alert">{error}</p>}
      {document ? (
        <EditorialArticle
          document={document}
          renderInsertion={
            interactive
              ? (index) => (
                  <div data-editor-tools className={styles.insertLine}>
                    <button
                      disabled={document.content.length >= 80}
                      aria-label={
                        index === 0
                          ? "첫 구간 앞에 요소 추가"
                          : index === document.content.length
                            ? "마지막에 요소 추가"
                            : `${index}번 구간 다음에 요소 추가`
                      }
                      onClick={() => {
                        if (text !== null) {
                          setError("수정 중인 문구를 먼저 적용하거나 취소해주세요.");
                          return;
                        }
                        setInsertion({
                          slug: document.slug,
                          afterId: index === 0 ? null : document.content[index - 1].id,
                        });
                        setSelection(null);
                        setConversion(null);
                        setError("");
                      }}
                    >
                      +<span>요소 추가</span>
                    </button>
                  </div>
                )
              : undefined
          }
        />
      ) : (
        <p className={styles.waiting}>편집기에서 문서를 불러오는 중이에요.</p>
      )}
      {document && id && operationReasons && interactive && !editorOpen && (
        <InlineBlockTools
          key={`${document.slug}:${id}`}
          id={id}
          document={document}
          reasons={operationReasons}
          previewScale={previewScale}
          pending={pendingBlockEdits}
          notice={operationNotice}
          onOperate={operate}
          onEdit={() => {
            setCoverPhoto(
              id === "@cover" && coverPhotoDrafts.current.has(document.slug)
                ? { slug: document.slug, value: coverPhotoDrafts.current.get(document.slug)! }
                : null,
            );
            setText(drafts.current.get(`${document.slug}:${id}`) ?? null);
            const saved = contentDrafts.current.get(`${document.slug}:${id}`);
            setContentEdit(saved ? { slug: document.slug, id, block: saved } : null);
            setEditingSelection({ slug: document.slug, id });
            requestAnimationFrame(() =>
              canvas.current
                ?.querySelector<HTMLButtonElement>("section[data-editor-tools] header button")
                ?.focus(),
            );
          }}
        />
      )}
      {document && insertion?.slug === document.slug && interactive && (
        <section data-editor-tools className={styles.tools} aria-label="요소 추가">
          <header>
            <strong>이 위치에 추가할 요소</strong>
            <button onClick={() => setInsertion(null)}>추가 취소 ×</button>
          </header>
          <div className={styles.kindGrid}>
            {(Object.entries(BLOCK_LABELS) as [EditorialBlock["type"], string][]).map(
              ([type, label]) => (
                <button
                  className={styles.option}
                  key={type}
                  onClick={() => {
                    try {
                      const next = insertEditorialBlock(
                        document,
                        insertion.afterId,
                        type,
                        () => `block-${crypto.randomUUID()}`,
                      );

                      commit(next.document);
                      setInsertion(null);
                      setSelection({ slug: document.slug, id: next.id });
                      setText(null);
                    } catch (cause) {
                      setError(
                        cause instanceof Error ? cause.message : "요소를 추가하지 못했어요.",
                      );
                    }
                  }}
                >
                  <LayoutMiniature kind={type} value={type} />
                  <span>{label}</span>
                </button>
              ),
            )}
          </div>
          <p>새 구간에 예시 문구가 들어갑니다. 추가한 뒤 문구와 스타일을 다듬어주세요.</p>
          {error && <p role="alert">{error}</p>}
        </section>
      )}
      {document && id && interactive && editorOpen && (
        <section
          key={
            blockedIssue
              ? `help-${id}-${blocked!.type}`
              : editingContent
                ? `content-${id}`
                : confirmation
                  ? `confirm-${id}-${confirmation.type}`
                  : `style-${id}`
          }
          data-editor-tools
          data-confirm={Boolean(
            editingCoverPhoto || confirmation || blockedIssue || editingContent || text !== null,
          )}
          data-wide={wideEditing}
          className={styles.tools}
          aria-label="구간 스타일"
        >
          {blockedIssue && blocked ? (
            <>
              <header>
                <span className={styles.selectionPosition}>{sectionPosition}</span>
                <button
                  ref={backToKinds}
                  onClick={() => {
                    setBlocked(null);
                    setKindsOpen(true);
                  }}
                >
                  ← 종류 목록
                </button>
                <button onClick={closeEditor}>편집 닫기 ×</button>
              </header>
              <div className={styles.confirmationBody}>
                <h2 className={styles.helpTitle}>이렇게 해보세요</h2>
                <p role="alert">{blockedIssue.message}</p>
              </div>
              <footer className={styles.confirmationFooter}>
                {blockedIssue.action && (
                  <button
                    className={styles.apply}
                    onClick={() => {
                      if (blockedIssue.code === "photo-layout") {
                        setBlocked(null);
                        setKindsOpen(false);
                        setError("");
                      } else if (blockedIssue.code === "add-block") {
                        const parent = document.content.find(
                          (block) =>
                            block.type === "split" &&
                            block.content.some((child) => child.id === id),
                        );
                        try {
                          const next = insertEditorialBlock(
                            document,
                            parent?.id ?? id,
                            blocked.type,
                            () => `block-${crypto.randomUUID()}`,
                          );
                          if (commit(next.document)) {
                            setSelection({ slug: document.slug, id: next.id });
                            setEditingSelection({ slug: document.slug, id: next.id });
                            setBlocked(null);
                            setKindsOpen(false);
                          }
                        } catch (cause) {
                          setError(cause instanceof Error ? cause.message : "추가할 수 없어요.");
                        }
                      }
                    }}
                  >
                    {blockedIssue.action}
                  </button>
                )}
                {error && <p role="alert">{error}</p>}
              </footer>
            </>
          ) : editingCoverPhoto ? (
            <>
              <header>
                <span className={styles.selectionPosition}>표지</span>
                <strong>사진 바꾸기</strong>
                <button onClick={closeEditor}>편집 닫기 ×</button>
              </header>
              <div className={styles.workspaceBody}>
                <ContentWorkspace
                  focusRef={workspace}
                  compact={compact}
                  id="@cover"
                  document={photoFeedback.length ? null : photoCandidate}
                  editor={
                    <div className={styles.contentFields}>
                      <PhotoPicker
                        photos={photos}
                        onUpload={addPhoto}
                        src={editingCoverPhoto.src}
                        onChange={(src) =>
                          setCoverPhoto({
                            slug: document.slug,
                            value: { ...editingCoverPhoto, src },
                          })
                        }
                      />
                      <div className={styles.contentField}>
                        <label htmlFor="cover-photo-alt">사진 설명</label>
                        <input
                          id="cover-photo-alt"
                          data-feedback-key="photo-alt"
                          aria-invalid={!editingCoverPhoto.alt.trim() || undefined}
                          aria-describedby={!editingCoverPhoto.alt.trim() ? feedbackId : undefined}
                          value={editingCoverPhoto.alt}
                          onChange={(event) =>
                            setCoverPhoto({
                              slug: document.slug,
                              value: { ...editingCoverPhoto, alt: event.target.value },
                            })
                          }
                        />
                      </div>
                      <div className={styles.contentField}>
                        <label htmlFor="cover-photo-caption">사진 캡션</label>
                        <textarea
                          id="cover-photo-caption"
                          data-feedback-key="photo-caption"
                          aria-invalid={!editingCoverPhoto.caption.trim() || undefined}
                          aria-describedby={
                            !editingCoverPhoto.caption.trim() ? feedbackId : undefined
                          }
                          value={editingCoverPhoto.caption}
                          onChange={(event) =>
                            setCoverPhoto({
                              slug: document.slug,
                              value: { ...editingCoverPhoto, caption: event.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  }
                />
              </div>
              <footer className={styles.confirmationFooter}>
                <InputFeedback id={feedbackId} feedback={photoFeedback} onJump={jumpToInput} />
                <button
                  onClick={() => {
                    coverPhotoDrafts.current.delete(document.slug);
                    setCoverPhoto(null);
                  }}
                >
                  취소
                </button>
                <button
                  className={styles.apply}
                  disabled={photoFeedback.length > 0}
                  aria-describedby={photoFeedback.length ? feedbackId : undefined}
                  onClick={() => {
                    if (photoCandidate && !photoFeedback.length && commit(photoCandidate)) {
                      coverPhotoDrafts.current.delete(document.slug);
                      setCoverPhoto(null);
                    }
                  }}
                >
                  사진 적용
                </button>
              </footer>
            </>
          ) : text !== null ? (
            <>
              <header>
                <span className={styles.selectionPosition}>{sectionPosition}</span>
                <strong>내용 수정</strong>
                <button onClick={closeEditor}>편집 닫기 ×</button>
              </header>
              <div className={styles.workspaceBody}>
                <ContentWorkspace
                  focusRef={workspace}
                  compact={compact}
                  id={id}
                  document={textMessages.length ? null : textCandidate}
                  editor={
                    <div className={styles.textEdit}>
                      <label htmlFor="selection-text">선택한 구간의 문구</label>
                      <textarea
                        id="selection-text"
                        data-feedback-key="selection-text"
                        value={text}
                        aria-invalid={textMessages.length > 0 || undefined}
                        aria-describedby={textMessages.length ? feedbackId : undefined}
                        onChange={(event) => setText(event.target.value)}
                      />
                    </div>
                  }
                />
              </div>
              <footer className={styles.confirmationFooter}>
                <InputFeedback id={feedbackId} feedback={textFeedback} onJump={jumpToInput} />
                <button
                  onClick={() => {
                    drafts.current.delete(`${document.slug}:${id}`);
                    setText(null);
                  }}
                >
                  취소
                </button>
                <button
                  className={styles.apply}
                  disabled={textMessages.length > 0}
                  aria-describedby={textMessages.length ? feedbackId : undefined}
                  onClick={applyText}
                >
                  내용 적용
                </button>
              </footer>
            </>
          ) : editingContent ? (
            <>
              <header>
                <span className={styles.selectionPosition}>{sectionPosition}</span>
                <strong>내용 수정</strong>
                <button onClick={closeEditor}>편집 닫기 ×</button>
              </header>
              <div className={styles.workspaceBody}>
                <ContentWorkspace
                  focusRef={workspace}
                  compact={compact}
                  id={id}
                  document={editedContentDocument}
                  editor={
                    <>
                      {(editingContent.block.type === "image" ||
                        editingContent.block.type === "split") && (
                        <PhotoPicker
                          photos={photos}
                          onUpload={addPhoto}
                          src={editingContent.block.image.src}
                          onChange={(src) => {
                            const block = editingContent.block;
                            if (block.type !== "image" && block.type !== "split") return;
                            const next = { ...block, image: { ...block.image, src } };
                            contentDrafts.current.set(`${document.slug}:${id}`, next);
                            setContentEdit({ ...editingContent, block: next });
                          }}
                        />
                      )}
                      <StructuredContentFields
                        block={editingContent.block}
                        onChange={(block) => {
                          contentDrafts.current.set(`${document.slug}:${id}`, block);
                          setContentEdit({ ...editingContent, block });
                        }}
                      />
                    </>
                  }
                />
              </div>
              <footer className={styles.confirmationFooter}>
                <InputFeedback id={feedbackId} feedback={contentFeedback} onJump={jumpToInput} />
                <button
                  onClick={() => {
                    contentDrafts.current.delete(`${document.slug}:${id}`);
                    setContentEdit(null);
                  }}
                >
                  취소
                </button>
                <button
                  className={styles.apply}
                  disabled={contentMessages.length > 0}
                  aria-describedby={contentMessages.length ? feedbackId : undefined}
                  onClick={() => {
                    if (commit(replaceEditorialBlock(document, editingContent.block))) {
                      contentDrafts.current.delete(`${document.slug}:${id}`);
                      setContentEdit(null);
                    }
                  }}
                >
                  내용 적용
                </button>
              </footer>
            </>
          ) : confirmation ? (
            <>
              <header>
                <span className={styles.selectionPosition}>{sectionPosition}</span>
                <button
                  ref={backToKinds}
                  onClick={() => {
                    setConversion(null);
                    setKindsOpen(true);
                    setError("");
                  }}
                >
                  ← 종류 목록
                </button>
                <button onClick={closeEditor}>편집 닫기 ×</button>
              </header>
              <div className={wideEditing ? styles.workspaceBody : styles.confirmationBody}>
                {wideEditing ? (
                  <ContentWorkspace
                    focusRef={workspace}
                    compact={compact}
                    id={id}
                    document={conversionDraft}
                    editor={
                      <>
                        <div className={styles.confirmationTitle}>
                          <h2>{BLOCK_LABELS[confirmation.type]} 구간으로 변경</h2>
                        </div>
                        <p>문장은 유지됩니다. 제목과 내용을 다듬고 미리보기를 확인해주세요.</p>
                        {needsSplit && !confirmation.override && (
                          <div className={styles.textEdit}>
                            <p>
                              첫 내용을 쓰고 Enter를 두 번 누른 뒤 다음 내용을 적어주세요. 내용을
                              나누면 아래에 미리보기가 나타납니다.
                            </p>
                            <label htmlFor="conversion-text">나눌 내용</label>
                            <textarea
                              ref={textInput}
                              id="conversion-text"
                              data-feedback-key="conversion-text"
                              value={confirmation.input ?? ""}
                              aria-invalid={!conversionDraft || undefined}
                              aria-describedby={!conversionDraft ? feedbackId : undefined}
                              onChange={(event) =>
                                setConversion({ ...confirmation, input: event.target.value })
                              }
                            />
                          </div>
                        )}
                        {convertedBlock && isStructuredBlock(convertedBlock) && (
                          <StructuredContentFields
                            block={confirmation.override ?? convertedBlock}
                            onChange={(block) =>
                              setConversion({
                                ...confirmation,
                                override: isStructuredBlock(block) ? block : undefined,
                              })
                            }
                          />
                        )}
                        {error && <p role="alert">{error}</p>}
                      </>
                    }
                  />
                ) : (
                  <>
                    <div className={styles.confirmationTitle}>
                      <h2>{BLOCK_LABELS[confirmation.type]} 구간으로 변경</h2>
                    </div>
                    <p>문장은 유지됩니다. 제목과 내용을 다듬고 미리보기를 확인해주세요.</p>
                    {convertedBlock && isStructuredBlock(convertedBlock) && (
                      <button onClick={() => setConversionEditing(true)}>내용 수정</button>
                    )}
                    <section aria-label="변경 결과 미리보기" className={styles.livePreview}>
                      {conversionDraft && convertedBlock ? (
                        <ReadingBlockPreview block={convertedBlock} />
                      ) : (
                        <p role="status">내용을 모두 채우면 미리보기가 나타납니다.</p>
                      )}
                    </section>
                    {error && <p role="alert">{error}</p>}
                  </>
                )}
              </div>
              <footer className={styles.confirmationFooter}>
                <InputFeedback id={feedbackId} feedback={conversionFeedback} onJump={jumpToInput} />
                <button
                  onClick={() => {
                    setConversion(null);
                    setKindsOpen(true);
                    setError("");
                  }}
                >
                  변경 취소
                </button>
                <button
                  className={styles.apply}
                  disabled={!conversionDraft}
                  aria-describedby={!conversionDraft ? feedbackId : undefined}
                  onClick={() => {
                    if (!conversionDraft) return;
                    const next = conversionDraft;
                    if (commit(next)) {
                      setConversion(null);
                      setKindsOpen(false);
                    }
                  }}
                >
                  종류 변경 적용
                </button>
              </footer>
            </>
          ) : (
            <>
              <header>
                <span className={styles.selectionPosition}>{sectionPosition}</span>
                <strong>
                  {id === "@cover" ? "표지" : BLOCK_LABELS[findEditorialBlock(document, id)!.type]}
                </strong>
                <button onClick={closeEditor}>편집 닫기 ×</button>
              </header>
              {error && <p role="alert">{error}</p>}
              {id !== "@cover" && (
                <details
                  className={styles.kinds}
                  open={kindsOpen}
                  onToggle={(event) => setKindsOpen(event.currentTarget.open)}
                >
                  <summary>종류 바꾸기</summary>
                  <div className={styles.kindGrid}>
                    {(Object.entries(BLOCK_LABELS) as [EditorialBlock["type"], string][]).map(
                      ([type, label]) => {
                        const issue = getConversionIssue(document, id, type);
                        return (
                          <button
                            key={type}
                            className={styles.option}
                            aria-pressed={findEditorialBlock(document, id)?.type === type}
                            onClick={() => {
                              if (text !== null) {
                                setError("수정 중인 문구를 먼저 적용하거나 취소해주세요.");
                                return;
                              }
                              if (issue && issue.code !== "split-text") {
                                setConversion(null);
                                setBlocked({ slug: document.slug, id, type });
                                setError("");
                                return;
                              }
                              setError("");
                              setBlocked(null);
                              setConversionEditing(false);
                              setConversion({
                                slug: document.slug,
                                id,
                                type,
                                ...(issue?.code === "split-text"
                                  ? { input: getSelectionText(document, id) ?? "" }
                                  : {}),
                              });
                            }}
                          >
                            <LayoutMiniature kind={type} value={type} />
                            <span>{label}</span>
                          </button>
                        );
                      },
                    )}
                  </div>
                  <p>사진이 필요한 종류를 고르면 사진 추가 방법을 안내해요.</p>
                </details>
              )}
              {groupButtons(false)}
              {groups.some((group) => group.advanced) && (
                <details>
                  <summary>더 보기</summary>
                  {groupButtons(true)}
                </details>
              )}
              {getEditorialPhoto(document, id) && (
                <button
                  onClick={() => {
                    if (id === "@cover")
                      setCoverPhoto({
                        slug: document.slug,
                        value:
                          coverPhotoDrafts.current.get(document.slug) ??
                          getEditorialPhoto(document, id)!,
                      });
                    else {
                      const block = findEditorialBlock(document, id)!;
                      setContentEdit({ slug: document.slug, id, block: structuredClone(block) });
                    }
                    setKindsOpen(false);
                  }}
                >
                  사진 바꾸기
                </button>
              )}
              {id !== "@cover" && getSelectionText(document, id) === null && (
                <button
                  onClick={() => {
                    const source = findEditorialBlock(document, id)!;
                    if (source) {
                      setContentEdit({
                        slug: document.slug,
                        id,
                        block:
                          contentDrafts.current.get(`${document.slug}:${id}`) ??
                          structuredClone(source),
                      });
                      setKindsOpen(false);
                    }
                  }}
                >
                  내용 수정
                </button>
              )}
              {getSelectionText(document, id) !== null && (
                <button onClick={() => setText(getSelectionText(document, id))}>내용 수정</button>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
