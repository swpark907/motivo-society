"use client";

// 클라이언트 컴포넌트인 이유: 브라우저의 인쇄 창(window.print)을 연다.
export function PrintButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      인쇄하기
    </button>
  );
}
