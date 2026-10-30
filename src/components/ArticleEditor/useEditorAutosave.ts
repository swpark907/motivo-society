"use client";
// IndexedDB 쓰기는 순서대로 완료하며 다른 탭의 저장본을 자동 덮어쓰지 않는다.
import { useEffect, useRef, useState } from "react";
import type { WorkbookReadingDocument } from "@/lib/content/workbook-editorial-schema";
import {
  createBrowserDraftStore,
  parseBrowserWorkspace,
  DraftConflictError,
  type BrowserWorkspace,
} from "@/lib/editorial/browser-draft";
export function useEditorAutosave(
  payload: BrowserWorkspace,
  documents: WorkbookReadingDocument[],
  onRestore: (saved: BrowserWorkspace) => void,
) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("브라우저 임시 저장을 준비하고 있어요.");
  const store = useRef<ReturnType<typeof createBrowserDraftStore> | null>(null);
  const blocked = useRef(false);
  const sequence = useRef(0);
  useEffect(() => {
    let alive = true;
    const controller = createBrowserDraftStore();
    store.current = controller;
    controller
      .read()
      .then((record) => {
        if (!alive) return;
        if (record) onRestore(parseBrowserWorkspace(record.data, documents));
        setReady(true);
      })
      .catch(() => {
        if (!alive) return;
        blocked.current = true;
        setReady(true);
        setStatus(
          "브라우저 임시 저장을 복원할 수 없어요. 기존 저장본은 유지합니다. 작업은 JSON으로 보관해주세요.",
        );
      });
    return () => {
      alive = false;
    };
  }, [documents, onRestore]);
  useEffect(() => {
    if (!ready || blocked.current || !store.current) return;
    let alive = true;
    const token = ++sequence.current;
    const controller = store.current;
    Promise.resolve()
      .then(() => {
        if (alive && token === sequence.current) setStatus("브라우저에 임시 저장 중…");
        return controller.save(parseBrowserWorkspace(payload, documents));
      })
      .then(() => {
        if (alive && token === sequence.current) setStatus("브라우저에 임시 저장됨");
      })
      .catch((error) => {
        if (error instanceof DraftConflictError) blocked.current = true;
        if (alive && token === sequence.current)
          setStatus(
            error instanceof DraftConflictError
              ? "다른 탭의 저장본이 있어 임시 저장을 멈췄어요. 이 탭의 글은 JSON으로 보관해주세요."
              : "브라우저 임시 저장에 실패했어요. 마지막 저장본은 유지합니다. JSON으로 보관해주세요.",
          );
      });
    return () => {
      alive = false;
    };
  }, [payload, ready, documents]);
  return { ready, status };
}
