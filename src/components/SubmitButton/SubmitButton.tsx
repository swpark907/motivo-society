"use client";

// 클라이언트 컴포넌트인 이유: 서버 액션 폼이 처리 중인지(useFormStatus) 알아 버튼을 잠그고 문구를 바꾼다.
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * 서버 액션 폼의 제출 버튼. 처리하는 동안 눌린 티가 나고 다시 누를 수 없다.
 * 같은 폼에 버튼이 여러 개면 누른 버튼에만 pendingLabel을 보인다(name·value로 구분).
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  const mine = pending && (!name || data?.get(name) === value);
  return (
    <button
      type="submit"
      className={className}
      name={name}
      value={value}
      disabled={pending}
      aria-busy={mine || undefined}
    >
      {mine && pendingLabel ? pendingLabel : children}
    </button>
  );
}
