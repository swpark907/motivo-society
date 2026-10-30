"use client";
// 복원 전 빈 상태로 저장본을 덮어쓰지 않는다. 이미지 변경분만 IndexedDB에 쓴다.
import { useEffect, useRef, useState, useCallback } from "react";
import {
  createResultDraftStore,
  ResultDraftConflict,
  type ResultDraft,
} from "@/lib/workbook-result-draft";

export function useResultDraft(
  scope: string,
  payload: ResultDraft,
  onRestore: (data: ResultDraft) => void,
) {
  const store = useRef<ReturnType<typeof createResultDraftStore> | null>(null);
  const blocked = useRef(false);
  const sequence = useRef(0);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("첨부 기록을 불러오는 중…");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    const controller = createResultDraftStore(scope);
    store.current = controller;
    controller
      .read()
      .then((data) => {
        if (!alive) return;
        if (data) onRestore(data);
        setReady(true);
      })
      .catch(() => {
        if (!alive) return;
        blocked.current = true;
        setReady(true);
        setStatus(
          "임시 저장본을 불러오지 못했어요. 기존 저장본은 유지하며, 현재 변경은 저장되지 않아요. 새로고침해 다시 시도해주세요.",
        );
      });
    return () => {
      alive = false;
    };
  }, [scope, onRestore]);
  useEffect(() => {
    if (!ready || blocked.current || !store.current) return;
    let alive = true;
    const token = ++sequence.current;
    const controller = store.current;
    Promise.resolve()
      .then(() => {
        if (alive) setStatus("브라우저에 임시 저장 중…");
        return controller.save(payload);
      })
      .then(() => {
        if (alive && sequence.current === token) setStatus("브라우저에 임시 저장됨");
      })
      .catch((error) => {
        if (error instanceof ResultDraftConflict) blocked.current = true;
        if (alive && sequence.current === token)
          setStatus(
            error instanceof ResultDraftConflict
              ? "다른 탭에서 저장본을 수정해 자동 저장을 멈췄어요. 새로고침해 최신 기록을 확인해주세요."
              : "임시 저장에 실패했어요. 마지막 저장본은 유지돼요. 저장을 다시 시도해주세요.",
          );
      });
    return () => {
      alive = false;
    };
  }, [ready, payload, retry]);
  const retrySave = useCallback(() => setRetry((value) => value + 1), []);
  return { ready, status, retrySave };
}
