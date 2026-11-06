import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { safeNext } from "@/lib/platform/auth-paths";
import { PERSONAS } from "@/lib/platform/personas";
import { getCurrentUser } from "@/lib/platform/session";
import { devSignInAs, signOut } from "./actions";
import { LoginForm } from "./LoginForm";
import s from "./login.module.scss";

export const metadata: Metadata = {
  title: "로그인",
  description: "이메일로 받은 링크로 모쏘에 로그인해요.",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  link: "링크가 만료되었거나 다른 브라우저에서 열렸어요. 메일을 다시 받아 주세요.",
  persona: "시험용 사람으로 들어가지 못했어요. 시험장을 처음 상태로 되돌린 뒤 다시 시도해 주세요.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  const user = await getCurrentUser();
  const isDev = process.env.NODE_ENV === "development";

  return (
    <main className={`paper ${s.page}`}>
      <div className={s.card}>
        <Image
          className={s.capy}
          src="/images/workbook/lesson-1-1/capy-turn.png"
          alt=""
          width={88}
          height={88}
          priority
        />
        <p className="label">SIGN IN</p>
        <h1 className={s.title}>모쏘에 들어가기</h1>

        {user ? (
          <div className={s.signedIn}>
            <p>
              <strong>{user.nickname ?? user.email}</strong>(으)로 로그인되어 있어요.
            </p>
            <div className={s.row}>
              <Link href={next} className={s.cta}>
                계속하기
              </Link>
              <form action={signOut}>
                <button type="submit" className={s.ghost}>
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <p className={s.lead}>
              이메일로 로그인 링크를 보내 드려요. 처음이면 그대로 가입돼요. 비밀번호는 없어요.
            </p>
            {error && (
              <p className={s.alert} role="alert">
                {error}
              </p>
            )}
            <LoginForm next={next} />
          </>
        )}

        {isDev && (
          <details className={s.dev}>
            <summary>개발용 · 시험장 사람으로 들어가기</summary>
            <p className={s.devNote}>
              로컬에서는 메일이 실제로 나가지 않고{" "}
              <a href="http://127.0.0.1:55424" target="_blank" rel="noreferrer">
                Mailpit
              </a>
              에 도착해요. 아래 가짜 사람은 운영 화면에 나오지 않아요.
            </p>
            <form action={devSignInAs} className={s.personas}>
              <input type="hidden" name="next" value={next} />
              {PERSONAS.map((p) => (
                <button key={p.handle} type="submit" name="handle" value={p.handle}>
                  <strong>{p.nickname}</strong>
                  <small>{p.role}</small>
                </button>
              ))}
            </form>
          </details>
        )}
      </div>
    </main>
  );
}
