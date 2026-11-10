"use client";

// 클라이언트 컴포넌트인 이유: 받은 소식이 실제로 그려진 뒤에 읽음으로 바꾼다(미리 불러오기로 읽음이 되지 않게).
import { useEffect } from "react";
import { markCalloutsReadAction } from "./actions";

export function MarkCalloutsRead() {
  useEffect(() => {
    void markCalloutsReadAction();
  }, []);
  return null;
}
