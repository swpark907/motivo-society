"use client";

// 클라이언트 컴포넌트인 이유: GNB는 모든 페이지의 공통 레이아웃이라, 서버에서 쿠키를 읽으면
// 정적 페이지(워크북·읽을거리)까지 매 요청 렌더로 바뀐다. 로그인 여부는 브라우저에서 읽는다.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar/Avatar";
import { loginHref } from "@/lib/platform/auth-paths";
import { createBrowserSupabase } from "@/lib/platform/supabase-browser";
import styles from "./Gnb.module.scss";

type Account = { name: string | null } | null | undefined; // undefined = 아직 확인 전, name null = 온보딩 전

export function AccountMenu() {
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  // 연결 정보가 없으면(로그인을 쓸 수 없는 환경) 처음부터 비로그인으로 둔다.
  const [account, setAccount] = useState<Account>(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    // 서버 액션으로 로그인·로그아웃한 뒤 화면이 바뀌면 다시 확인한다(경로가 의존성).
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        if (alive) setAccount(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();
      if (alive) setAccount({ name: profile?.nickname ?? null });
    })();
    return () => {
      alive = false;
    };
  }, [supabase, pathname]);

  if (account === undefined) return <span className={styles.accountPlaceholder} aria-hidden />;
  if (account === null) {
    // 로그인 화면에서는 같은 곳으로 가는 버튼을 또 두지 않는다.
    if (pathname === "/login") return null;
    return (
      <Link href={loginHref(pathname)} className={styles.login}>
        로그인
      </Link>
    );
  }
  if (account.name === null) {
    // 메일 링크로 들어왔지만 닉네임·관심사를 아직 정하지 않았다.
    if (pathname === "/onboarding") return null;
    return (
      <Link href="/onboarding" className={styles.login}>
        가입 마무리
      </Link>
    );
  }
  return (
    <Link href="/me" className={styles.me} aria-label={`${account.name} · 나`}>
      <Avatar name={account.name} size={28} />
      <span className={styles.meName}>{account.name}</span>
    </Link>
  );
}
