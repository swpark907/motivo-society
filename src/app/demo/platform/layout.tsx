import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sandboxEnv } from "@/lib/platform/supabase-server";
import { reseedSandbox, switchPersona } from "./actions";
import { getViewer } from "./_data";
import { PersonaBar } from "./PersonaBar";
import styles from "./sandbox.module.scss";

export const metadata: Metadata = {
  title: "플랫폼 시험장",
  robots: { index: false, follow: false },
};

export default async function PlatformSandboxLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();

  if (!sandboxEnv()) {
    return (
      <div className={`paper ${styles.sandbox}`}>
        <h1 className={styles.title}>플랫폼 시험장</h1>
        <p className={styles.muted}>
          로컬 Supabase 연결 정보가 없어요. 터미널에서 <code>supabase start</code>를 실행하고{" "}
          <code>.env.local</code>에 URL과 키를 넣어 주세요.
        </p>
      </div>
    );
  }

  const viewer = await getViewer();
  return (
    <div className={`paper ${styles.sandbox}`}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <p className={styles.eyebrow}>PLATFORM SANDBOX · 로컬 가짜 데이터</p>
          <nav className={styles.tabs} aria-label="시험장 메뉴">
            <Link href="/demo/platform/home">회원 홈(시안)</Link>
            <Link href="/demo/platform/host">호스트(시안)</Link>
            <Link href="/demo/platform">활동 목록</Link>
            <Link href="/demo/platform/new">활동 만들기</Link>
            <Link href="/demo/platform/clubs">클럽</Link>
            <Link href="/demo/platform/me">내 활동</Link>
            <Link href="/demo/platform/ops">운영 대기열</Link>
            <Link href="/demo/platform/settlements">정산</Link>
            <Link href="/demo/platform/log">운영 기록</Link>
          </nav>
        </div>
        <PersonaBar
          currentHandle={viewer?.handle ?? null}
          switchPersona={switchPersona}
          reseedSandbox={reseedSandbox}
        />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
