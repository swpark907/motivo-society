import type { Metadata } from "next";
import Link from "next/link";
import { KindTag } from "@/components/KindTag/KindTag";
import { previewInvite } from "@/lib/platform/clubs";
import { errorMessage } from "@/lib/platform/messages";
import { getCurrentUser } from "@/lib/platform/session";
import { acceptInviteAction } from "../../clubs/[slug]/actions";
import s from "./invite.module.scss";

export const metadata: Metadata = { title: "클럽 초대", robots: { index: false } };

/** 초대 링크: 어느 클럽인지 보여 주고, 로그인 → 한 번 눌러 가입 → 클럽으로. */
export default async function InvitePage({ params, searchParams }: PageProps<"/invite/[code]">) {
  const { code } = await params;
  const errorCode = (await searchParams).error;
  const [invite, user] = await Promise.all([previewInvite(code), getCurrentUser()]);
  const here = `/invite/${code}`;

  return (
    <main className={`paper ${s.page}`}>
      <section className={s.card} aria-labelledby="invite-h">
        {!invite ? (
          <>
            <p className="label">INVITE</p>
            <h1 id="invite-h" className={s.title}>
              찾을 수 없는 초대예요
            </h1>
            <p className={s.lead}>
              링크가 잘렸거나 없어진 초대예요. 보낸 사람에게 다시 받아 주세요.
            </p>
            <Link href="/clubs" className={s.ghost}>
              클럽 둘러보기
            </Link>
          </>
        ) : (
          <>
            <div className={s.club}>
              <KindTag kind="club">클럽</KindTag>
              <h1 id="invite-h" className={s.title}>
                {invite.name}에 초대받았어요
              </h1>
              {invite.tagline && <p className={s.lead}>{invite.tagline}</p>}
              <p className={s.muted}>멤버 {invite.members}명</p>
            </div>

            {typeof errorCode === "string" && /^[a-z_]+$/.test(errorCode) && (
              <p className={s.error} role="alert">
                {errorMessage(errorCode)}
              </p>
            )}

            {!invite.valid ? (
              <>
                <p className={s.lead}>
                  이 초대는 만료됐거나 더 쓸 수 없어요. 클럽 화면에서 직접 가입할 수 있어요.
                </p>
                <Link href={`/clubs/${invite.slug}`} className={s.ghost}>
                  클럽 보기
                </Link>
              </>
            ) : !user ? (
              <>
                <p className={s.muted}>로그인하면 이 화면으로 돌아와요. 처음이면 가입부터 해요.</p>
                <Link href={`/login?next=${encodeURIComponent(here)}`} className={s.cta}>
                  로그인하고 초대 받기
                </Link>
              </>
            ) : (
              <form action={acceptInviteAction} className={s.form}>
                <input type="hidden" name="code" value={code} />
                <input type="hidden" name="slug" value={invite.slug} />
                <p className={s.muted}>초대로 들어오면 승인 없이 바로 멤버가 돼요.</p>
                <button type="submit" className={s.cta}>
                  {user.nickname}님으로 가입하기
                </button>
                <Link href={`/clubs/${invite.slug}`} className={s.ghost}>
                  먼저 클럽 둘러보기
                </Link>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
