"use client";

// 클라이언트 컴포넌트인 이유: 사람을 바꾼 뒤 지금 보던 화면으로 돌아오려면 현재 경로(usePathname)가 필요하다.
import { usePathname } from "next/navigation";
import { PERSONAS } from "@/lib/platform/personas";
import styles from "./sandbox.module.scss";

type Props = {
  currentHandle: string | null;
  switchPersona: (formData: FormData) => Promise<void>;
  reseedSandbox: (formData: FormData) => Promise<void>;
};

export function PersonaBar({ currentHandle, switchPersona, reseedSandbox }: Props) {
  const pathname = usePathname();
  return (
    <div className={styles.personaBar}>
      <form action={switchPersona} className={styles.personaList} aria-label="이 사람으로 보기">
        <input type="hidden" name="returnTo" value={pathname} />
        <span className={styles.personaLabel}>이 사람으로 보기</span>
        {PERSONAS.map((p) => (
          <button
            key={p.handle}
            type="submit"
            name="handle"
            value={p.handle}
            className={styles.personaButton}
            aria-pressed={currentHandle === p.handle}
            title={`${p.role} · ${p.note}`}
          >
            <strong>{p.nickname}</strong>
            <small>{p.role}</small>
          </button>
        ))}
        <button
          type="submit"
          name="handle"
          value="anon"
          className={styles.personaButton}
          aria-pressed={currentHandle === null}
        >
          <strong>로그아웃</strong>
          <small>비회원</small>
        </button>
      </form>
      <form action={reseedSandbox}>
        <input type="hidden" name="returnTo" value={pathname} />
        <button type="submit" className={styles.smallGhost} title="가짜 데이터를 처음대로 되돌려요">
          처음 상태로
        </button>
      </form>
    </div>
  );
}
