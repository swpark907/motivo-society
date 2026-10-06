"use client";

// 브라우저에만 진행을 저장한다. 저장이 막혀도 메모리 안에서 활동을 계속한다.
import { useEffect, useState } from "react";
import {
  initialProgress,
  JOURNEY_KEY,
  readProgress,
  type JourneyProgress,
} from "@/lib/workbook-journey";
export function useJourneyProgress() {
  const [progress, setProgress] = useState(initialProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const saved = readProgress(localStorage.getItem(JOURNEY_KEY));
      // 초기 로딩은 브라우저 저장소를 읽은 뒤에만 완료한다.
      queueMicrotask(() => {
        setProgress(saved);
        setReady(true);
      });
    } catch {
      queueMicrotask(() => {
        setStorageError(true);
        setReady(true);
      });
    }
  }, []);
  function update(next: JourneyProgress) {
    setProgress(next);
    try {
      localStorage.setItem(JOURNEY_KEY, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  return { progress, ready, storageError, update };
}
