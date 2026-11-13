import type { Metadata } from "next";
import Image from "next/image";
import { isRemoteImage } from "@/lib/platform/media";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActivityCard } from "@/components/ActivityCard/ActivityCard";
import { Avatar } from "@/components/Avatar/Avatar";
import { CapySays } from "@/components/CapySays/CapySays";
import { KindTag } from "@/components/KindTag/KindTag";
import { LineIcon } from "@/components/LineIcon/LineIcon";
import { getActivityDetail, type ActivityDetail } from "@/lib/platform/activity-detail";
import {
  certFormatsText,
  certRuleText,
  dateOnly,
  refundText,
  sessionState,
  sessionWhen,
} from "@/lib/platform/activity-text";
import { clockTime, gatheringWhen, periodWhen, shortDate } from "@/lib/platform/activity-time";
import { applyState, periodOver } from "@/lib/platform/apply-state";
import { getChallengeRoom } from "@/lib/platform/challenge-room";
import { getLedger } from "@/lib/platform/host-ledger";
import { listMyNotices } from "@/lib/platform/host-notices";
import { RunOnMount } from "@/components/RunOnMount/RunOnMount";
import { markNoticesReadAction } from "./notice-actions";
import { entryMeta, LedgerStatement } from "@/components/LedgerStatement/LedgerStatement";
import { KIND_LABELS, won } from "@/lib/platform/messages";
import { listOpenActivities } from "@/lib/platform/queries";
import { getCurrentUser } from "@/lib/platform/session";
import { ApplyPanel } from "./ApplyPanel";
import { ChallengeRoom } from "./ChallengeRoom";
import s from "./activity.module.scss";

type Props = PageProps<"/activities/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getActivityDetail(slug);
  if (!result.found) return { title: "활동을 찾을 수 없어요", robots: { index: false } };
  const a = result.activity;
  const description = a.summary ?? `${KIND_LABELS[a.kind]} · ${a.organizer.name}`;
  // 표지 이미지는 같은 폴더의 opengraph-image가 만든다(표지가 없어도 종류 색 + 제목으로).
  return {
    title: a.title,
    description,
    openGraph: { title: a.title, description, type: "website" },
  };
}

export default async function ActivityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const noticeCode = (await searchParams).notice;
  const notice =
    noticeCode === "cancelled"
      ? "신청을 취소했어요."
      : noticeCode === "cert_submitted"
        ? "오늘 인증을 올렸어요."
        : null;
  const result = await getActivityDetail(slug);
  if (!result.found) {
    // 회차 주소로 들어오면 시즌 화면의 회차 목록으로 보낸다.
    if (result.seriesSlug) redirect(`/activities/${result.seriesSlug}#sessions`);
    notFound();
  }
  const a = result.activity;
  const now = new Date();
  const over = isOver(a, now);
  const state = applyState(
    {
      status: a.status,
      allowLateJoin: a.allowLateJoin,
      applyOpensAt: a.applyOpensAt,
      applyClosesAt: a.applyClosesAt,
      capacity: a.capacity,
      taken: a.taken,
      price: a.price,
      audience: a.audience,
      signedIn: a.viewer.signedIn,
      isManager: a.viewer.isManager,
      isClubMember: a.viewer.isClubMember,
      hasEntitlement: a.viewer.hasEntitlement,
      mine: a.viewer.mine,
      periodOver: over,
    },
    now,
  );
  // 신청한 사람(어떤 상태든)만 사람 정보를 읽는다. 서로 기대지 않는 읽기는 한 번에(DM 진입 화면이라 기다림을 줄인다).
  const [{ items }, user] = await Promise.all([
    listOpenActivities(now),
    a.viewer.mine ? getCurrentUser() : Promise.resolve(null),
  ]);
  const confirmed = a.viewer.mine === "confirmed";
  const [room, ledger, notices] = await Promise.all([
    // 챌린지 참여 영역은 확정 참가자에게만(비참가자에게는 인증 칸이 없다).
    user && confirmed && a.kind === "challenge" ? getChallengeRoom(a.id, user.id, now) : null,
    // 호스트가 공개한 장부는 확정된 참가자에게만 보인다(DB 함수가 정한다, 영수증은 빼고).
    confirmed ? getLedger(a.id) : null,
    // 호스트가 남긴 공지는 받은 사람에게만 보인다(받은 사람은 보낸 순간의 명단, H10).
    user ? listMyNotices(a.id, user.id) : [],
  ]);
  const others = items
    .filter((x) => x.id !== a.id)
    .sort((x, y) => Number(y.host === a.organizer.name) - Number(x.host === a.organizer.name))
    .slice(0, 4);
  const left = a.capacity === null ? null : Math.max(0, a.capacity - a.taken);
  const isDev = process.env.NODE_ENV === "development";

  return (
    <main data-platform className={`paper ${s.page}`}>
      <div className={s.inner}>
        <nav className={s.crumbs} aria-label="위치">
          <Link href="/explore">둘러보기</Link>
          <span aria-hidden="true">/</span>
          <span>{KIND_LABELS[a.kind]}</span>
        </nav>

        {notice && (
          <p className={s.notice} role="status">
            {notice}
          </p>
        )}

        <article className={s.layout}>
          <div className={s.main}>
            <div className={s.hero} data-kind={a.kind}>
              {a.cover ? (
                <Image
                  src={a.cover}
                  unoptimized={isRemoteImage(a.cover)}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 760px, 100vw"
                />
              ) : (
                <span className={s.heroFallback} aria-hidden="true">
                  {a.title}
                </span>
              )}
            </div>

            <header className={s.head}>
              <div className={s.tags}>
                <KindTag kind={a.kind}>
                  {KIND_LABELS[a.kind]}
                  {a.kind === "series" && a.sessions.length > 0 && ` · ${a.sessions.length}회`}
                </KindTag>
                <span className={s.state}>{statusLine(a, over)}</span>
              </div>
              <h1 className={s.title}>{a.title}</h1>
              {a.summary && <p className={s.summary}>{a.summary}</p>}
              <ul className={s.facts}>
                <li>
                  <LineIcon name="calendar" />
                  <span>
                    <strong>{whenMain(a, now)}</strong>
                    {whenSub(a) && <small>{whenSub(a)}</small>}
                  </span>
                </li>
                {a.place && (
                  <li>
                    <LineIcon name={a.place.online ? "video" : "pin"} />
                    <span>
                      <strong>
                        {a.place.online
                          ? (a.place.name ?? "온라인")
                          : [a.place.name, a.place.area].filter(Boolean).join(" · ") || "장소 미정"}
                      </strong>
                      {!over && <small>{placeNote(a)}</small>}
                    </span>
                  </li>
                )}
                <li>
                  <LineIcon name="users" />
                  <span>
                    {/* 끝난 활동은 지난 일로 말한다(남은 자리 · 확정 방식 안내는 의미가 없다). */}
                    <strong>
                      {over
                        ? `${a.taken}명이 함께했어요`
                        : a.capacity === null
                          ? `${a.taken}명 참여 중`
                          : left === 0
                            ? `정원 ${a.capacity}명이 찼어요`
                            : `${a.taken}명 참여 중 · ${left}자리 남음`}
                    </strong>
                    {!over && (
                      <small>
                        {a.joinMode === "approval"
                          ? "여는 사람이 확인한 뒤 확정돼요"
                          : a.price > 0
                            ? "입금이 확인되면 확정돼요"
                            : "신청하면 바로 확정돼요"}
                      </small>
                    )}
                  </span>
                </li>
              </ul>
            </header>

            {room && a.challenge && (
              <ChallengeRoom
                room={room}
                activityId={a.id}
                slug={a.slug}
                startsOn={a.challenge.startsOn}
              />
            )}

            {a.viewer.privateInfo && <PrivateInfo a={a} now={now} />}

            {notices.length > 0 && (
              <section className={s.block} aria-labelledby="notices-h" id="notices">
                <h2 id="notices-h">여는 사람의 공지</h2>
                <ul className={s.notices}>
                  {notices.map((n) => (
                    <li key={n.id}>
                      <p className={s.noticeHead}>
                        {n.unread && <span className={s.newBadge}>새 공지</span>}
                        <strong>{n.title ?? "공지"}</strong>
                        <small>
                          {shortDate(new Date(n.createdAt))} {clockTime(new Date(n.createdAt))}
                        </small>
                      </p>
                      <p className={s.noticeText}>{n.body}</p>
                    </li>
                  ))}
                </ul>
                {notices.some((n) => n.unread) && (
                  <RunOnMount action={markNoticesReadAction.bind(null, a.id)} />
                )}
              </section>
            )}

            {/* 소개가 없으면 제목 아래 요약과 같은 문장을 다시 쓰지 않는다. 요약도 없을 때만 안내한다. */}
            {(a.description && a.description !== a.summary) || !a.summary ? (
              <section className={s.block} aria-labelledby="about-h">
                <h2 id="about-h">이런 {KIND_LABELS[a.kind]}이에요</h2>
                <p>{a.description ?? "여는 사람이 소개를 준비하고 있어요."}</p>
              </section>
            ) : null}

            {a.kind === "series" && a.sessions.length > 0 && (
              <section className={s.block} aria-labelledby="sessions-h" id="sessions">
                <h2 id="sessions-h">회차</h2>
                <ol className={s.sessions}>
                  {a.sessions.map((x) => {
                    const st = sessionState(x.startsAt, x.status, now);
                    return (
                      <li key={x.no} data-state={st ?? undefined}>
                        <span className={s.sessionNo}>{x.no}</span>
                        <span className={s.sessionBody}>
                          <strong>{sessionTitle(x.title, a.title)}</strong>
                          <small>{sessionWhen(x.startsAt)}</small>
                        </span>
                        {st && <span className={s.sessionState}>{st}</span>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {a.challenge && (
              <section className={s.block} aria-labelledby="rule-h">
                <h2 id="rule-h">인증 방법</h2>
                <dl className={s.policy}>
                  <div>
                    <dt>기간</dt>
                    <dd>
                      {dateOnly(a.challenge.startsOn)} – {dateOnly(a.challenge.endsOn)}
                    </dd>
                  </div>
                  <div>
                    <dt>인증</dt>
                    <dd>
                      {certRuleText(a.challenge.rule, a.challenge.n)} ·{" "}
                      {certFormatsText(a.challenge.formats)}
                    </dd>
                  </div>
                  <div>
                    <dt>완주</dt>
                    <dd>{a.challenge.threshold}번 인증하면 완주예요.</dd>
                  </div>
                </dl>
              </section>
            )}

            {ledger?.access === "participant" && (
              <section className={s.block} aria-labelledby="ledger-h">
                <h2 id="ledger-h">활동 장부</h2>
                <p>여는 사람이 참가자에게 공개한 돈의 흐름이에요.</p>
                <LedgerStatement ledger={ledger} />
                {ledger.entries.length > 0 && (
                  <ul className={s.ledgerEntries}>
                    {ledger.entries.map((e) => (
                      <li key={e.id}>
                        <span>
                          {e.memo}
                          <small>{entryMeta(e)}</small>
                        </span>
                        <strong>
                          {e.kind === "income" ? "+" : "−"} {won(e.amount)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className={s.block} aria-labelledby="host-h">
              <h2 id="host-h">여는 {a.organizer.kind === "club" ? "클럽" : "사람"}</h2>
              <div className={s.hostCard}>
                <Avatar name={a.organizer.name} size={56} />
                <div>
                  <strong>{a.organizer.name}</strong>
                  {a.organizer.tagline && <p>{a.organizer.tagline}</p>}
                  {a.facilitators.length > 0 && (
                    <p className={s.muted}>
                      진행 {a.facilitators.map((f) => f.nickname).join(", ")}
                    </p>
                  )}
                </div>
                {a.organizer.clubSlug && (
                  <Link href={`/clubs/${a.organizer.clubSlug}`} className={s.ghost}>
                    클럽 보기
                  </Link>
                )}
              </div>
            </section>

            <section className={s.block} aria-labelledby="policy-h">
              <h2 id="policy-h">신청 전에 알아 두세요</h2>
              <dl className={s.policy}>
                {a.audience !== "anyone" && (
                  <div>
                    <dt>대상</dt>
                    <dd>
                      {a.audience === "club_members" ? (
                        `${a.organizer.name} 멤버만 신청할 수 있어요.`
                      ) : a.requiredActivity ? (
                        <>
                          <Link href={`/activities/${a.requiredActivity.slug}`}>
                            {a.requiredActivity.title}
                          </Link>
                          에 참가한 사람만 신청할 수 있어요.
                        </>
                      ) : (
                        "앞선 활동에 참가한 사람만 신청할 수 있어요."
                      )}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>비용</dt>
                  <dd>
                    {a.price > 0
                      ? `${won(a.price)}${a.kind === "series" ? " (시즌 전체)" : ""}. 신청하면 자리가 잡히고, 안내된 기한 안에 계좌로 입금하면 운영진이 확인한 뒤 확정돼요.`
                      : "무료예요."}
                  </dd>
                </div>
                {a.refundRules && (
                  <div>
                    <dt>환불</dt>
                    <dd>
                      {refundText(a.refundRules)}
                      {isDev && <span className={s.devNote}> (시험값 · 대표 승인 전)</span>}
                    </dd>
                  </div>
                )}
                {a.status === "in_progress" && a.allowLateJoin && (
                  <div>
                    <dt>중간 합류</dt>
                    <dd>이미 시작했지만 지금 합류할 수 있어요. 지난 일정은 함께하지 못해요.</dd>
                  </div>
                )}
              </dl>
            </section>
            {/* 카피바라 한마디: 진행 중 합류가 열린 활동에서만(실제 규칙 그대로) */}
            {a.status === "in_progress" && a.allowLateJoin && !a.viewer.mine && (
              <CapySays>지금 들어와도 돼요. 지난 일정만 함께하지 못해요.</CapySays>
            )}
          </div>

          <ApplyPanel
            state={state}
            applyHref={`/activities/${a.slug}/apply`}
            price={a.price > 0 ? won(a.price) : "무료"}
            priceSub={a.kind === "series" ? `시즌 ${a.sessions.length}회` : KIND_LABELS[a.kind]}
            capacity={a.capacity}
            taken={a.taken}
            title={a.title}
            room={room ? { href: "#today", label: roomLabel(room) } : undefined}
          />
        </article>

        {others.length > 0 && (
          <section aria-labelledby="more-h">
            <div className={s.sectionHead}>
              <div>
                <h2 id="more-h">이런 활동도 있어요</h2>
                <p>지금 모집 중인 다른 활동</p>
              </div>
              <Link href="/explore">둘러보기로</Link>
            </div>
            <ul className={s.grid}>
              {others.map((x) => (
                <li key={x.id}>
                  <ActivityCard activity={x} now={now} href={`/activities/${x.slug}`} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className={s.mobileSpacer} aria-hidden="true" />
      </div>
    </main>
  );
}

/** "4주 바이브코딩 시즌 2회차 · 첫 화면" → "첫 화면" (번호는 옆 칸에 있다) */
function sessionTitle(title: string, seriesTitle: string): string {
  const rest = title
    .replace(seriesTitle, "")
    .replace(/^\s*\d+회차\s*·?\s*/, "")
    .trim();
  return rest || title;
}

/** 신청 패널에서 참여 영역으로 가는 버튼 이름. */
function roomLabel(room: NonNullable<Awaited<ReturnType<typeof getChallengeRoom>>>): string {
  if (room.phase !== "during") return "내 챌린지 기록 보기";
  return room.todayCert ? "오늘 인증 보기" : "오늘 인증하러 가기";
}

/** 끝난 활동인지: 상태가 ended이거나, 아직 ended로 바뀌기 전이라도 기간이 지났으면. */
function isOver(a: ActivityDetail, now: Date): boolean {
  return (
    a.status === "ended" ||
    (a.status !== "cancelled" &&
      a.status !== "draft" &&
      periodOver({ kind: a.kind, endsAt: a.endsAt, challengeEndsOn: a.challenge?.endsOn }, now))
  );
}

function statusLine(a: ActivityDetail, over: boolean): string {
  if (a.status === "cancelled") return "취소된 활동";
  if (over) return a.kind === "challenge" ? "기간 끝남" : "끝난 활동";
  if (a.status === "in_progress")
    return a.allowLateJoin ? "진행 중 · 중간에 합류할 수 있어요" : "진행 중";
  if (a.status === "ended") return "끝난 활동";
  if (a.status === "cancelled") return "취소된 활동";
  if (a.status === "closed") return "모집 마감";
  return "모집 중";
}

function whenMain(a: ActivityDetail, now: Date): string {
  if (!a.startsAt) return "일정 미정";
  const start = new Date(a.startsAt);
  if (a.kind === "challenge" && a.challenge) {
    return `${dateOnly(a.challenge.startsOn)} – ${dateOnly(a.challenge.endsOn)}`;
  }
  if (a.kind === "series") {
    const next = a.sessions.find((x) => x.startsAt && new Date(x.startsAt) >= now);
    return next?.startsAt
      ? `다음 회차 ${gatheringWhen(new Date(next.startsAt), now)}`
      : periodWhen(start, null);
  }
  return gatheringWhen(start, now);
}

function whenSub(a: ActivityDetail): string | null {
  if (!a.startsAt) return null;
  if (a.kind === "series" && a.sessions.length > 0) {
    const first = a.sessions[0].startsAt;
    const last = a.sessions[a.sessions.length - 1].startsAt;
    return first && last
      ? `${periodWhen(new Date(first), new Date(last))} · ${a.sessions.length}회`
      : null;
  }
  if (a.kind === "gathering" && a.endsAt) {
    return `${clockTime(new Date(a.startsAt))} – ${clockTime(new Date(a.endsAt))}`;
  }
  return null;
}

function placeNote(a: ActivityDetail): string {
  if (a.kind === "challenge") return "참가한 사람끼리 이 화면에서 인증을 올려요";
  if (a.viewer.privateInfo) return "자세한 안내는 아래 참가 정보에 있어요";
  if (a.place?.online) return "화상 링크는 참가가 확정되면 시작 30분 전에 열려요";
  if (a.place?.hideAddress) return "자세한 주소는 참가가 확정되면 보여요";
  return "자세한 위치는 참가 안내에서 확인해요";
}

function PrivateInfo({ a, now }: { a: ActivityDetail; now: Date }) {
  const info = a.viewer.privateInfo!;
  // 화상 링크 안내는 온라인 활동에만(오프라인 모임에 "링크가 열려요"를 보이지 않는다).
  const opens = a.place?.online && info.videoOpensAt ? new Date(info.videoOpensAt) : null;
  // 챌린지처럼 따로 알려 줄 주소·링크가 없으면 칸을 만들지 않는다.
  if (!info.addressDetail && !info.videoUrl && !(opens && opens > now)) return null;
  return (
    <section className={s.private} aria-labelledby="private-h">
      <h2 id="private-h">참가 정보</h2>
      {info.addressDetail && (
        <p>
          <LineIcon name="pin" size={16} /> {info.addressDetail}
        </p>
      )}
      {info.videoUrl ? (
        <a href={info.videoUrl} target="_blank" rel="noreferrer" className={s.videoLink}>
          <LineIcon name="video" size={16} /> 화상 모임 들어가기
        </a>
      ) : (
        opens &&
        opens > now && (
          <p>
            <LineIcon name="video" size={16} /> 화상 링크는 {gatheringWhen(opens, now)}에 열려요.
          </p>
        )
      )}
    </section>
  );
}
