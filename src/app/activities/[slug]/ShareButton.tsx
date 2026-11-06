"use client";

// 클라이언트 컴포넌트인 이유: 휴대폰의 공유 시트(navigator.share)나 클립보드는 브라우저에서만 쓸 수 있다.
import { useState } from "react";
import { LineIcon } from "@/components/LineIcon/LineIcon";
import s from "./activity.module.scss";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // 취소했거나 막혔으면 링크 복사로 넘어간다.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("이 링크를 복사해 주세요", url);
    }
  }

  return (
    <button type="button" className={s.ghost} onClick={share} aria-live="polite">
      <LineIcon name="share" size={16} />
      {copied ? "링크를 복사했어요" : "공유"}
    </button>
  );
}
