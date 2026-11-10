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

// 로그인·온보딩을 막 마치고 떠나는 화면. 여기서 확인한 상태(비로그인·가입 전)는 다음 화면에서 곧 바뀌므로,
// 다시 확인할 때까지 "로그인"·"가입 마무리"를 잠깐이라도 보여 주지 않는다(검수 F-014).
const AUTH_STEPS = ["/login", "/onboarding", "/auth/callback"];

export function AccountMenu() {
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  // 연결 정보가 없으면(로그인을 쓸 수 없는 환경) 처음부터 비로그인으로 둔다.
  const [checked, setChecked] = useState<{ account: Account; path: string }>({
    account: supabase ? undefined : null,
    path: pathname,
  });
  const stale =
    checked.path !== pathname &&
    AUTH_STEPS.includes(checked.path) &&
    (checked.account === null || checked.account?.name === null);
  const account = stale ? undefined : checked.account;

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    // 서버 액션으로 로그인·로그아웃한 뒤 화면이 바뀌면 다시 확인한다(경로가 의존성).
    void (async () => {
      // getSession은 쿠키만 읽는다. 지워진 계정의 낡은 쿠키를 믿지 않도록 서버에 확인한다.
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        if (alive) setChecked({ account: null, path: pathname });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();
      if (alive) setChecked({ account: { name: profile?.nickname ?? null }, path: pathname });
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
    <Link href="/me" className={styles.me} aria-label={`${account.name} · MY`}>
      <Avatar name={account.name} size={28} />
      <span className={styles.meName}>{account.name}</span>
    </Link>
  );
}
