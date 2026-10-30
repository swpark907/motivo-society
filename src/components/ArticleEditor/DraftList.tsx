"use client";
// 목록과 삭제 확인은 같은 모달에서 제공하고 네이티브 dialog가 포커스를 가둔다.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import styles from "./ArticleEditor.module.scss";
type Entry = { document: WorkbookReadingDocument; updatedAt: number };
export function DraftList({
  sessions,
  currentSlug,
  onSelect,
  onDelete,
  onClose,
}: {
  sessions: Entry[];
  currentSlug: string;
  onSelect: (slug: string) => void;
  onDelete: (slug: string) => string | null;
  onClose: () => void;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    modal.current?.showModal();
  }, []);
  const target = sessions.find((entry) => entry.document.slug === deleting);
  useEffect(() => {
    if (deleting) cancel.current?.focus();
    else search.current?.focus();
  }, [deleting]);
  const entries = sessions
    .filter(({ document }) =>
      `${document.title} ${document.slug}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <dialog
      ref={modal}
      className={`${styles.documentDialog} ${styles.draftList}`}
      aria-label={target ? "초안 삭제 확인" : "임시 저장 목록"}
      onCancel={(event) => {
        event.preventDefault();
        if (target) {
          setDeleting(null);
          setError("");
        } else onClose();
      }}
    >
      <header>
        <h2>{target ? "초안을 삭제할까요?" : "임시 저장 목록"}</h2>
        <button onClick={onClose} aria-label="임시 저장 목록 닫기">
          닫기 ×
        </button>
      </header>
      <div className={styles.dialogBody}>
        {target ? (
          <>
            <strong>{target.document.title}</strong>
            <p>
              이 글과 미적용 수정 내용을 브라우저에서 삭제합니다. 다른 글의 ‘같이 보면 좋은 글들’
              연결도 정리합니다. 업로드한 사진은 사진 목록에 남습니다.
            </p>
            <p>삭제 후에는 되돌릴 수 없어요. 보관하려면 취소 후 JSON으로 내보내주세요.</p>
            {error && <p role="alert">{error}</p>}
          </>
        ) : (
          <>
            <p>이 브라우저에 저장된 글 {sessions.length}편 · 제목을 눌러 이어서 편집하세요.</p>
            <label>
              글 찾기
              <input
                ref={search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="제목 또는 글 주소"
              />
            </label>
            {entries.length ? (
              <ul className={styles.draftEntries}>
                {entries.map(({ document, updatedAt }) => (
                  <li key={document.slug}>
                    <button className={styles.draftOpen} onClick={() => onSelect(document.slug)}>
                      <Image
                        className={styles.draftThumbnail}
                        src={document.thumbnail}
                        alt=""
                        width={64}
                        height={64}
                        sizes="(min-width: 768px) 64px, 48px"
                      />
                      <div className={styles.draftDetails}>
                        <strong>{document.title}</strong>
                        <span>
                          {document.slug}
                          {document.slug === currentSlug ? " · 편집 중" : ""}
                        </span>
                        <small>
                          {updatedAt
                            ? new Date(updatedAt).toLocaleString("ko-KR")
                            : "이전에 저장한 글"}
                        </small>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setDeleting(document.slug);
                        setError("");
                      }}
                      aria-label={`${document.title} 초안 삭제`}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {sessions.length
                  ? "찾는 글이 없어요. 다른 검색어를 입력해보세요."
                  : "임시 저장한 글이 없어요. 새 글을 작성해보세요."}
              </p>
            )}
          </>
        )}
      </div>
      {target && (
        <footer>
          <button
            ref={cancel}
            onClick={() => {
              setDeleting(null);
              setError("");
            }}
          >
            취소
          </button>
          <button
            onClick={() => {
              const error = onDelete(target.document.slug);
              if (error) setError(error);
              else setDeleting(null);
            }}
          >
            초안 삭제
          </button>
        </footer>
      )}
    </dialog>
  );
}
