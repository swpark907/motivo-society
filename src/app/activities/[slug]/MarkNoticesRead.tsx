"use client";

// 클라이언트 컴포넌트인 이유: 공지가 실제로 화면에 그려진 뒤에 읽음으로 바꾼다
// (서버가 화면을 만드는 동안 바꾸면 미리 불러오기만 해도 읽음이 된다).
import { useEffect } from "react";
import { markNoticesReadAction } from "./notice-actions";

export function MarkNoticesRead({ activityId }: { activityId: string }) {
  useEffect(() => {
    void markNoticesReadAction(activityId);
  }, [activityId]);
  return null;
}
