import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityCard } from "@/components/ActivityCard/ActivityCard";
import { Avatar } from "@/components/Avatar/Avatar";
import { KindTag } from "@/components/KindTag/KindTag";
import { clubJoinState, facesLine, type ClubJoinState } from "@/lib/platform/club-state";
import { getClubDetail, type ClubDetail } from "@/lib/platform/clubs";
import { errorMessage, noticeMessage } from "@/lib/platform/messages";
import { InvitePanel } from "./InvitePanel";
import { joinAction, leaveAction } from "./actions";
import s from "./club.module.scss";
import { SubmitButton } from "@/components/SubmitButton/SubmitButton";

type Props = PageProps<"/clubs/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const club = await getClubDetail((await params).slug);
  if (!club) return { title: "클럽을 찾을 수 없어요", robots: { index: false } };
  const description = club.tagline ?? `${club.name} · 모티보 소사이어티 클럽`;
  return { title: club.name, description, openGraph: { title: club.name, description } };
}

const NOTICES = ["active", "pending", "club_left", "invite_joined"];

export default async function ClubPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const club = await getClubDetail(slug);
  if (!club) notFound();
  const noticeCode =
    typeof sp.notice === "string" && NOTICES.includes(sp.notice) ? sp.notice : null;
  const errorCode = typeof sp.error === "string" && /^[a-z_]+$/.test(sp.error) ? sp.error : null;

  const state = clubJoinState({
    signedIn: club.me !== null,
    joinMode: club.joinMode,
    status: club.me?.status ?? null,
    layerName: club.me?.layerName ?? null,
  });
  const staff = club.members.filter((m) => m.kind !== "member");
  const faces = facesLine(club.members.map((m) => m.nickname));

  return (
    <main data-platform className={`paper ${s.page}`}>
      <div className={s.inner}>
        <nav className={s.crumbs} aria-label="위치">
          <Link href="/clubs">클럽</Link>
          <span aria-hidden="true">/</span>
          <span>{club.name}</span>
        </nav>

        {noticeCode && (
          <p className={s.notice} role="status">
            {noticeMessage(noticeCode)}
          </p>
        )}
        {errorCode && (
          <p className={s.errorBox} role="alert">
            {errorMessage(errorCode)}
          </p>
        )}

        <div className={s.layout}>
          <header className={s.hero}>
            <KindTag kind="club">클럽</KindTag>
            <h1>{club.name}</h1>
            {club.tagline && <p>{club.tagline}</p>}
            <div className={s.faces} aria-label={`멤버 ${club.members.length}명`}>
              {faces.shown.map((n) => (
                <Avatar key={n} name={n} size={32} />
              ))}
              <span>
                멤버 {club.members.length}명{faces.rest > 0 && ` · 외 ${faces.rest}명`}
              </span>
            </div>
          </header>

          <JoinCard club={club} state={state} />

          <div className={s.main}>
            <section className={s.block} aria-labelledby="about-h">
              <h2 id="about-h">이런 클럽이에요</h2>
              <p>{club.description ?? club.tagline ?? "운영진이 소개를 준비하고 있어요."}</p>
              <p className={s.muted}>
                {club.joinMode === "approval"
                  ? "가입하면 운영진이 확인한 뒤 멤버가 돼요."
                  : "누구나 바로 가입할 수 있어요."}
              </p>
            </section>

            <section className={s.block} aria-labelledby="acts-h">
              <h2 id="acts-h">클럽 활동</h2>
              {club.activities.length ? (
                <ul className={s.grid}>
                  {club.activities.map((a) => (
                    <li key={a.id}>
                      <ActivityCard activity={a} now={new Date()} href={`/activities/${a.slug}`} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.muted}>지금 모집 중인 활동이 없어요.</p>
              )}
            </section>

            <section className={s.block} aria-labelledby="people-h">
              <h2 id="people-h">함께하는 사람</h2>
              {staff.length > 0 && (
                <ul className={s.staff} aria-label="운영진">
                  {staff.map((p) => (
                    <li key={p.nickname}>
                      <Avatar name={p.nickname} size={40} />
                      <span>
                        <strong>{p.nickname}</strong>
                        <small>{p.layer}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className={s.muted}>
                운영진 {staff.length}명과 멤버 {club.members.length - staff.length}명이 함께해요.
              </p>
            </section>

            {club.me?.canInvite && (
              <section className={s.block} aria-labelledby="invite-h">
                <h2 id="invite-h">초대하기</h2>
                <InvitePanel clubId={club.id} />
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function JoinCard({ club, state }: { club: ClubDetail; state: ClubJoinState }) {
  return (
    <aside className={s.side} aria-label="가입">
      <div className={s.joinCard}>
        <p className={s.joinNote}>{state.note}</p>
        {state.kind === "login" && (
          <Link href={`/login?next=${encodeURIComponent(`/clubs/${club.slug}`)}`} className={s.cta}>
            {state.label}
          </Link>
        )}
        {state.kind === "join" && (
          <form action={joinAction}>
            <input type="hidden" name="clubId" value={club.id} />
            <input type="hidden" name="slug" value={club.slug} />
            <SubmitButton className={s.cta} pendingLabel="처리하는 중…">
              {state.label}
            </SubmitButton>
          </form>
        )}
        {(state.kind === "member" || state.kind === "pending" || state.kind === "banned") && (
          <p className={s.pill} data-kind={state.kind} role="status">
            {state.label}
          </p>
        )}
        {state.kind === "member" && (
          <details className={s.leave}>
            <summary>클럽 나가기</summary>
            <form action={leaveAction}>
              <input type="hidden" name="clubId" value={club.id} />
              <input type="hidden" name="slug" value={club.slug} />
              <p>나가도 다시 가입할 수 있어요. 신청한 활동은 그대로 남아요.</p>
              <SubmitButton className={s.danger} pendingLabel="나가는 중…">
                정말 나갈게요
              </SubmitButton>
            </form>
          </details>
        )}
      </div>
    </aside>
  );
}
