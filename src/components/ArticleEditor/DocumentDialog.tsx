"use client";
// 작성 시작과 기본정보는 요청할 때만 열어 캔버스 공간을 유지한다.
import { useEffect, useRef, useState } from "react";
import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import { validateEditorialDraft } from "@/lib/editorial/editor-state";
import { MAX_EDITORIAL_JSON_BYTES } from "@/lib/editorial/media-limits";
import type { DialogDraft } from "@/lib/editorial/browser-draft";
import styles from "./ArticleEditor.module.scss";
export function DocumentDialog({
  mode,
  document,
  documents,
  trustedDocuments,
  onApply,
  onClose,
  initialDraft,
  onDraft,
}: {
  mode: "new" | "import" | "info";
  document: WorkbookReadingDocument;
  documents: WorkbookReadingDocument[];
  trustedDocuments: WorkbookReadingDocument[];
  onApply: (document: WorkbookReadingDocument) => void;
  onClose: () => void;
  initialDraft: DialogDraft | null;
  onDraft: (draft: DialogDraft) => void;
}) {
  const [draft, setDraft] = useState<WorkbookReadingDocument>(
    () =>
      initialDraft?.draft ??
      (mode === "new"
        ? {
            ...structuredClone(document),
            slug: "",
            title: "새 글",
            summary: "글을 소개하는 문장을 적어주세요.",
            displayTitle: undefined,
            deck: undefined,
            tags: ["메모"],
            sources: [],
            related: [],
            nextTry: "직접 해볼 일을 적어주세요.",
            layout: "note",
            content: [
              {
                type: "text",
                id: "intro",
                text: "첫 문단을 적어주세요.",
                width: "reading",
                align: "left",
                tone: "body",
              },
            ],
          }
        : structuredClone(document)),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(initialDraft?.loaded ?? mode !== "import");
  const lastDraft = useRef("");
  useEffect(() => {
    const snapshot = { mode, draft, loaded };
    const serialized = JSON.stringify(snapshot);
    if (serialized !== lastDraft.current) {
      lastDraft.current = serialized;
      onDraft(snapshot);
    }
  }, [mode, draft, loaded, onDraft]);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = window.document.activeElement;
    dialogRef.current?.querySelector<HTMLElement>("input:not([readonly]),button")?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  const fileRequest = useRef(0);
  const set = <K extends keyof WorkbookReadingDocument>(
    key: K,
    value: WorkbookReadingDocument[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (mode !== "info" && documents.some((entry) => entry.slug === draft.slug)) {
      setErrors(["이미 사용 중인 주소예요. 새 주소를 입력해주세요. 기존 글은 바뀌지 않습니다."]);
      return;
    }
    const catalog = mode === "info" ? documents : [...documents, draft];
    const result = validateEditorialDraft(
      draft,
      catalog,
      mode === "info" ? document.slug : draft.slug,
      trustedDocuments,
    );
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onApply(result.document);
  };
  const field = (
    key: "title" | "summary" | "thumbnailAlt" | "visualCaption" | "nextTry",
    label: string,
    multiline = false,
  ) => (
    <label>
      {label}
      {multiline ? (
        <textarea value={draft[key]} onChange={(event) => set(key, event.target.value)} rows={3} />
      ) : (
        <input value={draft[key]} onChange={(event) => set(key, event.target.value)} />
      )}
    </label>
  );
  return (
    <div
      className={styles.dialogBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={styles.documentDialog}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          mode === "new" ? "새 글 작성" : mode === "import" ? "JSON 불러오기" : "글 기본정보"
        }
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key === "Tab") {
            const fields = Array.from(
              dialogRef.current?.querySelectorAll<HTMLElement>(
                "button:not(:disabled),input,textarea,select,summary",
              ) ?? [],
            ).filter((element) => element.getClientRects().length > 0);
            const first = fields[0],
              last = fields[fields.length - 1];
            if (event.shiftKey && window.document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && window.document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <h2>
            {mode === "new" ? "새 글 작성" : mode === "import" ? "JSON 불러오기" : "글 기본정보"}
          </h2>
          <button onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>
        <div className={styles.dialogBody}>
          <p>이 브라우저에 자동 임시 저장됩니다. JSON으로도 보관할 수 있어요.</p>
          {mode === "import" && (
            <label>
              JSON 파일
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  const request = ++fileRequest.current;
                  setLoaded(false);
                  setErrors([]);
                  if (!file) return;
                  if (file.size > MAX_EDITORIAL_JSON_BYTES) {
                    setErrors(["16MB 이하의 JSON 파일을 선택해주세요."]);
                    return;
                  }
                  try {
                    const value: unknown = JSON.parse(await file.text());
                    if (request !== fileRequest.current) return;
                    const result = validateEditorialDraft(
                      value,
                      trustedDocuments,
                      "",
                      trustedDocuments,
                      true,
                    );
                    if (!result.ok) {
                      setErrors(result.errors);
                      return;
                    }
                    setDraft(result.document);
                    setLoaded(true);
                  } catch {
                    if (request === fileRequest.current)
                      setErrors(["JSON 파일을 읽을 수 없어요. 파일 형식을 확인해주세요."]);
                  }
                }}
              />
            </label>
          )}
          {loaded && (
            <>
              <label>
                글 주소 (영문 소문자·숫자·하이픈)
                <input
                  autoFocus={mode === "new"}
                  value={draft.slug}
                  readOnly={mode === "info"}
                  onChange={(event) => set("slug", event.target.value)}
                />
              </label>
              {mode === "info" && <small>글 주소는 연결된 링크를 위해 유지합니다.</small>}
              {field("title", "글 제목 · 목록과 공유에 표시")}
              {field("summary", "소개글", true)}
              <label>
                태그 · 쉼표로 구분
                <input
                  value={draft.tags.join(",")}
                  onChange={(event) => set("tags", event.target.value.split(","))}
                />
              </label>
              <label>
                글 형식
                <select
                  value={draft.layout}
                  onChange={(event) =>
                    set("layout", event.target.value as WorkbookReadingDocument["layout"])
                  }
                >
                  <option value="note">짧은 메모</option>
                  <option value="feature">피처</option>
                  <option value="guide">긴 가이드</option>
                </select>
              </label>
              <details>
                <summary>표지 제목과 설명</summary>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.displayTitle !== undefined}
                    onChange={(event) =>
                      set("displayTitle", event.target.checked ? [draft.title] : undefined)
                    }
                  />
                  표지 제목 따로 쓰기
                </label>
                {draft.displayTitle && (
                  <label>
                    표지 제목 · 최대 세 줄
                    <textarea
                      value={draft.displayTitle.join("\n")}
                      onChange={(event) => set("displayTitle", event.target.value.split("\n"))}
                    />
                  </label>
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={draft.deck !== undefined}
                    onChange={(event) =>
                      set("deck", event.target.checked ? draft.summary : undefined)
                    }
                  />
                  표지 소개글 따로 쓰기
                </label>
                {draft.deck !== undefined && (
                  <label>
                    표지 소개글
                    <textarea
                      value={draft.deck}
                      onChange={(event) => set("deck", event.target.value)}
                    />
                  </label>
                )}
                <p>별도 설정이 없으면 글 제목과 소개글을 그대로 사용합니다.</p>
                {field("thumbnailAlt", "표지 사진 대체 설명")}
                {field("visualCaption", "표지 사진 설명")}
                {mode === "new" && <p>표지는 임시로 기존 사진을 사용합니다.</p>}
              </details>
              <details>
                <summary>출처와 같이 보면 좋은 글</summary>
                <label>
                  출처 URL · 한 줄에 하나
                  <textarea
                    value={draft.sources.join("\n")}
                    onChange={(event) =>
                      set("sources", event.target.value ? event.target.value.split("\n") : [])
                    }
                  />
                </label>
                {field("nextTry", "읽고 나서 해볼 일", true)}
                {draft.related.map((item, index) => (
                  <div key={index}>
                    <label>
                      관련 글 {index + 1}
                      <select
                        value={item.slug}
                        onChange={(event) =>
                          set(
                            "related",
                            draft.related.map((entry, i) =>
                              i === index ? { ...entry, slug: event.target.value } : entry,
                            ),
                          )
                        }
                      >
                        <option value="">글 선택</option>
                        {documents
                          .filter((entry) => entry.slug !== draft.slug)
                          .map((entry) => (
                            <option key={entry.slug} value={entry.slug}>
                              {entry.title}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      추천 이유
                      <input
                        value={item.reason}
                        onChange={(event) =>
                          set(
                            "related",
                            draft.related.map((entry, i) =>
                              i === index ? { ...entry, reason: event.target.value } : entry,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      onClick={() =>
                        set(
                          "related",
                          draft.related.filter((_, i) => i !== index),
                        )
                      }
                    >
                      관련 글 {index + 1} 삭제
                    </button>
                  </div>
                ))}
                <button
                  disabled={draft.related.length >= 2}
                  onClick={() => set("related", [...draft.related, { slug: "", reason: "" }])}
                >
                  관련 글 추가
                </button>
              </details>
            </>
          )}
          {errors.length > 0 && (
            <ul role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
        <footer>
          <button onClick={onClose}>취소</button>
          <button
            disabled={
              !loaded || (mode === "info" && JSON.stringify(draft) === JSON.stringify(document))
            }
            onClick={submit}
          >
            {mode === "info" ? "기본정보 적용" : "글 열기"}
          </button>
        </footer>
      </section>
    </div>
  );
}
