"use client";

// 클라이언트 컴포넌트인 이유: 화면이 실제로 그려진 뒤에 서버 액션을 한 번 부른다.
// 예: 공지 · 받은 소식 읽음 처리 — 서버가 화면을 만드는 동안 바꾸면 미리 불러오기만 해도 읽음이 된다.
import { useEffect, useRef } from "react";

export function RunOnMount({ action }: { action: () => Promise<unknown> }) {
  const done = useRef(false);
  useEffect(() => {
    // 개발 모드에서 효과가 두 번 돌아도 한 번만 부른다.
    if (done.current) return;
    done.current = true;
    void action();
  }, [action]);
  return null;
}
