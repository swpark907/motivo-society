import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { KindTag } from "@/components/KindTag/KindTag";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton/SubmitButton";
import { clockTime, gatheringWhen, periodWhen, shortDate } from "@/lib/platform/activity-time";
import {
  getCreateOptions,
  getHostAccess,
  getHostActivity,
  listHostActivities,
  type HostActivityDetail,
} from "@/lib/platform/host";
import { getSentCallout, type SentCallout } from "@/lib/platform/host-callouts";
import { getLedger } from "@/lib/platform/host-ledger";
import { AUDIENCE_LABELS, listSentNotices } from "@/lib/platform/host-notices";
import { listSnippets } from "@/lib/platform/host-saved";
import { NoticeComposer } from "./NoticeComposer";
import { listMedia, type MediaAsset } from "@/lib/platform/host-media";
import type { Ledger } from "@/lib/platform/ledger-view";
import { kstDateKey } from "@/lib/platform/schedule";
import { entryMeta, LedgerStatement } from "@/components/LedgerStatement/LedgerStatement";
import { isRemoteImage, mediaUrl } from "@/lib/platform/media";
import {
  attendanceCounts,
  attendanceOpensAt,
  canCheckAttendance,
  groupRoster,
  manageActions,
  moneySummary,
  orderBadge,
  progressText,
  type RosterRow,
} from "@/lib/platform/host-activity-view";
import { hostStatusLabel, hostTabOf, seatText } from "@/lib/platform/host-view";
import {
  ACTIVITY_STATUS_LABELS,
  errorMessage,
  noticeMessage,
  ORDER_STATUS_LABELS,
  REFUND_STATUS_LABELS,
  won,
} from "@/lib/platform/messages";
import { requireUser } from "@/lib/platform/session";
import Image from "next/image";
import { MediaUploadFields } from "../../media/MediaUploadFields";
import {
  attendanceAction,
  decideAction,
  finalizeAction,
  publishAction,
  deleteLedgerAction,
  ledgerPublicAction,
  saveLedgerAction,
  sendCalloutAction,
  withdrawNoticeAction,
  setCoverAction,
  uploadCoverAction,
} from "./actions";
import s from "./manage.module.scss";
import { isUuid } from "@/lib/platform/ids";

export const metadata: Metadata = {
  title: "활동 관리",
  robots: { index: false },
};

export default async function HostActivityPage({
  params,
  searchParams,
}: PageProps<"/host/activities/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const sp = await searchParams;
  await requireUser(`/host/activities/${id}`);
  const result = await getHostActivity(id);
  if (!result.found) notFound();
  if (!result.canManage) {
    return (
      <PlatformPage label="HOST" title="활동 관리" back={{ href: "/host", label: "호스트 도구" }}>
        <EmptyState
          title="이 활동을 관리할 권한이 없어요"
          body="활동을 연 사람과 함께 진행하는 사람, 클럽에서 관리 역할을 맡은 사람만 명단과 돈 기록을 봐요."
          action={{ href: "/host", label: "내가 연 활동 보기" }}
        />
      </PlatformPage>
    );
  }

  const a = result.activity;
  const now = new Date();
  // 관리 권한을 확인한 뒤에만, 그리고 그 칸을 보여 주는 활동에서만 칸별 데이터를 읽는다.
  // 시즌 회차는 표지 · 장부 · 공지 · 다시 부르기를 시즌에서 하므로 읽지 않는다.
  const full = a.series === null;
  const canCallout = full && (a.status === "open" || a.status === "in_progress");
  const [access, media, options, ledger, notices, snippets, callout, mine] = await Promise.all([
    full ? getHostAccess() : Promise.resolve(null),
    full ? listMedia() : Promise.resolve([]),
    full ? getCreateOptions() : Promise.resolve({ hostTier: null, official: false, clubs: [] }),
    full ? getLedger(id) : Promise.resolve({ access: "none" } as const),
    full ? listSentNotices(id) : Promise.resolve([]),
    full ? listSnippets() : Promise.resolve([]),
    full ? getSentCallout(id) : Promise.resolve(null),
    // 다시 부르기 대상 고르기에만 쓴다(열린 활동에서만 보낼 수 있다).
    canCallout ? listHostActivities() : Promise.resolve([]),
  ]);
  const notice = typeof sp.notice === "string" ? noticeMessage(sp.notice) : null;
  const errorCode = typeof sp.error === "string" && /^[a-z_]+$/.test(sp.error) ? sp.error : null;
  const isSession = a.series !== null;
  const actions = manageActions({ ...a, isSession }, now);
  const back = a.series
    ? { href: `/host/activities/${a.series.id}`, label: a.series.title }
    : { href: "/host", label: "호스트 도구" };

  return (
    <PlatformPage
      label={isSession ? `HOST · ${a.sessionNo}회차` : "HOST"}
      title={a.title}
      lead={[whenText(a, now), a.place].filter(Boolean).join(" · ")}
      back={back}
    >
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {errorCode && (
        <p className={s.errorBox} role="alert">
          {errorMessage(errorCode)}
        </p>
      )}

      <section className={s.overview} aria-label="개요">
        <div className={s.tags}>
          <KindTag kind={a.kind} />
          <StatusBadge
            status={hostTabOf(a, now) === "past" ? "ended" : a.status}
            label={
              // 회차의 open은 모집이 아니라 "열릴 예정"이다(신청은 시즌에서 받는다).
              isSession && a.status === "open" && hostTabOf(a, now) !== "past"
                ? "예정"
                : hostStatusLabel(a, now, ACTIVITY_STATUS_LABELS)
            }
          />
          {a.joinMode === "approval" && <span className={s.chip}>승인제</span>}
          {a.clubName && <span className={s.chip}>{a.clubName}</span>}
        </div>

        {actions.publish && (
          <form action={publishAction} className={s.callout}>
            <input type="hidden" name="activityId" value={a.id} />
            <p>
              <strong>아직 공개 전이에요.</strong> 나와 함께 관리하는 사람에게만 보여요. 공개하면
              발견에 올라가고 신청을 받아요.
            </p>
            <SubmitButton className={s.primary} pendingLabel="공개하는 중…">
              공개하기
            </SubmitButton>
          </form>
        )}
        {actions.finalize && (
          <form action={finalizeAction} className={s.callout}>
            <input type="hidden" name="activityId" value={a.id} />
            <p>
              <strong>기간이 끝났어요.</strong> 완주를 판정하면 챌린지가 종료되고,{" "}
              {a.threshold
                ? `인정된 인증이 ${a.threshold}회 이상인 사람이`
                : "완주 조건을 채운 사람이"}{" "}
              완주로 기록돼요. 판정은 되돌릴 수 없어요.
            </p>
            <SubmitButton className={s.primary} pendingLabel="판정하는 중…">
              완주 판정하기
            </SubmitButton>
          </form>
        )}

        <dl className={s.tiles}>
          {isSession ? (
            <>
              <Tile label="참가자" value={`${a.roster.length}명`} />
              <Tile label="출석 체크" value={`${checked(a.roster)}/${a.roster.length}명`} />
            </>
          ) : (
            <>
              <Tile
                label="확정"
                value={seatText({ confirmed: count(a.roster, "confirmed"), capacity: a.capacity })}
              />
              {(a.joinMode === "approval" || count(a.roster, "pending_approval") > 0) && (
                <Tile label="승인 대기" value={`${count(a.roster, "pending_approval")}명`} />
              )}
              {(a.price > 0 || count(a.roster, "pending_payment") > 0) && (
                <Tile label="입금 대기" value={`${count(a.roster, "pending_payment")}명`} />
              )}
              {(a.capacity !== null || count(a.roster, "waitlisted") > 0) && (
                <Tile label="대기" value={`${count(a.roster, "waitlisted")}명`} />
              )}
              <Tile label="참가비" value={a.price > 0 ? won(a.price) : "무료"} />
            </>
          )}
        </dl>

        <div className={s.links}>
          {actions.viewPublic && (
            <Link href={`/activities/${a.slug}`} className={s.secondary}>
              참가자 화면 보기 →
            </Link>
          )}
          {/* 지난 활동을 바탕으로 다음 활동을 연다(H04). 회차는 시즌에서 가져온다. */}
          {!isSession && access && (access.hostTier || access.clubCreate || access.official) && (
            <Link href={`/host/new?from=${a.id}`} className={s.secondary}>
              이 활동으로 새로 만들기
            </Link>
          )}
        </div>
      </section>

      {!isSession && (
        <Cover
          a={a}
          // 내 보관함 이미지는 어느 활동에나, 클럽 보관함 이미지는 그 클럽 활동에만.
          assets={media.filter((m) => m.clubId === null || m.clubId === a.clubId)}
          owners={[
            { value: "me", label: "내 보관함" },
            ...options.clubs
              .filter((c) => c.id === a.clubId)
              .map((c) => ({ value: c.id, label: `클럽 · ${c.name}` })),
          ]}
        />
      )}

      <Roster a={a} now={now} />

      {!isSession && (
        <section className={s.section} id="notices" aria-labelledby="notices-h">
          <h2 id="notices-h">공지</h2>
          <details className={s.ledgerAdd} open={notices.length === 0}>
            <summary>공지 남기기</summary>
            <NoticeComposer
              activityId={a.id}
              counts={{
                confirmed: count(a.roster, "confirmed"),
                waitlisted: count(a.roster, "waitlisted"),
                pending_payment: count(a.roster, "pending_payment"),
              }}
              snippets={snippets}
            />
          </details>
          {notices.length > 0 && (
            <ul className={s.people} aria-label="보낸 공지">
              {notices.map((n) => (
                <li key={n.id} className={s.person} data-withdrawn={n.withdrawn || undefined}>
                  <div className={s.who}>
                    <strong>{n.title ?? "공지"}</strong>
                    <Meta
                      parts={[
                        `${shortDate(new Date(n.createdAt))} ${clockTime(new Date(n.createdAt))}`,
                        n.audience.map((x) => AUDIENCE_LABELS[x]).join(" · "),
                        `받은 ${n.recipients}명 · 읽은 ${n.read}명`,
                        ...(n.withdrawn ? ["내림"] : []),
                      ]}
                    />
                    <p className={s.noticeBody}>{n.body}</p>
                  </div>
                  {!n.withdrawn && (
                    <form
                      action={withdrawNoticeAction}
                      className={s.buttons}
                      aria-label={`${n.title ?? "공지"} 내리기`}
                    >
                      <input type="hidden" name="activityId" value={a.id} />
                      <input type="hidden" name="noticeId" value={n.id} />
                      <SubmitButton className={s.ghostSmall} pendingLabel="내리는 중…">
                        내리기
                      </SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!isSession && (
        <CalloutSection
          a={a}
          sent={callout}
          sources={mine
            .filter((x) => x.id !== a.id && x.status !== "draft" && x.confirmed > 0)
            .map((x) => ({ id: x.id, title: x.title, kind: x.kind, confirmed: x.confirmed }))}
        />
      )}

      {a.kind === "series" && a.sessions.length > 0 && (
        <section className={s.section} aria-labelledby="sessions-h">
          <h2 id="sessions-h">회차</h2>
          <p className={s.hint}>회차를 누르면 그 회차의 출석을 체크해요.</p>
          <ul className={s.sessions}>
            {a.sessions.map((x) => (
              <li key={x.id}>
                <Link href={`/host/activities/${x.id}`}>
                  <span className={s.sessionNo}>{x.no}회차</span>
                  <span className={s.sessionBody}>
                    <strong>{sessionName(x.title, a.title, x.no)}</strong>
                    <small>
                      {x.startsAt ? gatheringWhen(new Date(x.startsAt), now) : "일정 미정"}
                      {x.status === "cancelled"
                        ? " · 취소"
                        : x.startsAt && new Date(x.startsAt) <= now
                          ? ` · 출석 ${x.attended}명`
                          : ""}
                    </small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isSession && (a.price > 0 || a.orders.length > 0) && <Money a={a} now={now} />}

      {ledger.access === "manager" && (
        <LedgerSection a={a} ledger={ledger} today={kstDateKey(now)} />
      )}
    </PlatformPage>
  );
}

/** 회차 제목에서 "시즌명 n회차 · " 앞부분을 덜어 낸다. 모양이 다르면 그대로 둔다. */
function sessionName(title: string, seriesTitle: string, no: number): string {
  const prefix = `${seriesTitle} ${no}회차 · `;
  return title.startsWith(prefix) ? title.slice(prefix.length) : title;
}

function checked(rows: RosterRow[]): number {
  const c = attendanceCounts(rows);
  return c.attended + c.absent;
}

function count(rows: RosterRow[], status: RosterRow["status"]): number {
  return rows.filter((r) => r.status === status).length;
}

function whenText(a: HostActivityDetail, now: Date): string {
  if (!a.startsAt) return "일정 미정";
  if (a.kind === "gathering") return gatheringWhen(new Date(a.startsAt), now);
  return periodWhen(new Date(a.startsAt), a.endsAt ? new Date(a.endsAt) : null);
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.tile}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Roster({ a, now }: { a: HostActivityDetail; now: Date }) {
  const groups = groupRoster(a.roster);
  const isGathering = a.kind === "gathering";
  const canCheck = isGathering && a.status !== "cancelled" && canCheckAttendance(a.startsAt, now);
  const att = attendanceCounts(a.roster);

  return (
    <section className={s.section} id="roster" aria-labelledby="roster-h">
      <h2 id="roster-h">참가자 명단</h2>
      {groups.length > 0 && (
        <div className={s.rosterTools}>
          {canCheck && (
            <Link href={`/host/activities/${a.id}/check`} className={s.primarySmall}>
              빠른 출석 체크
            </Link>
          )}
          {/* 내보낼 때마다 감사 기록이 남는다(이메일·입금자명은 넣지 않는다). */}
          <a href={`/host/activities/${a.id}/roster.csv`} className={s.ghostSmall} download>
            명단 CSV 받기
          </a>
          {isGathering && (
            // 출석표를 열면 내보냄 기록이 남아서, 미리 불러오기(prefetch)로 기록이 생기지 않게 끈다.
            <Link href={`/host/activities/${a.id}/print`} className={s.ghostSmall} prefetch={false}>
              출석표 인쇄
            </Link>
          )}
        </div>
      )}
      {isGathering && a.startsAt && a.roster.some((r) => r.status === "confirmed") && (
        <p className={s.hint}>
          {canCheck
            ? `출석 참석 ${att.attended} · 불참 ${att.absent} · 아직 ${att.unchecked}`
            : `출석은 ${shortDate(attendanceOpensAt(a.startsAt))} ${clockTime(attendanceOpensAt(a.startsAt))}부터 체크할 수 있어요.`}
        </p>
      )}
      {groups.length === 0 ? (
        <EmptyState
          title="아직 신청한 사람이 없어요"
          body={a.status === "draft" ? "공개하면 신청을 받아요." : undefined}
        />
      ) : (
        groups.map((g) => (
          <div key={g.status} className={s.group}>
            <h3>
              {g.label} <span>{g.rows.length}</span>
            </h3>
            <ul className={s.people}>
              {g.rows.map((r) => (
                <li key={r.participationId} className={s.person}>
                  <div className={s.who}>
                    <strong>{r.nickname}</strong>
                    <Meta parts={personMeta(r, a.threshold, now)} />
                  </div>
                  {r.status === "pending_approval" && (
                    <form action={decideAction} className={s.buttons}>
                      <input type="hidden" name="activityId" value={a.id} />
                      <input type="hidden" name="participationId" value={r.participationId} />
                      <SubmitButton
                        className={s.primarySmall}
                        name="approve"
                        value="true"
                        pendingLabel="처리 중…"
                      >
                        승인
                      </SubmitButton>
                      <SubmitButton
                        className={s.ghostSmall}
                        name="approve"
                        value="false"
                        pendingLabel="처리 중…"
                      >
                        거절
                      </SubmitButton>
                    </form>
                  )}
                  {r.status === "confirmed" && isGathering && (
                    <AttendanceButtons a={a} r={r} canCheck={canCheck} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

// 한 줄 정보는 조각마다 끊기지 않게 하고, 좁으면 조각 사이에서만 줄을 바꾼다.
function Meta({ parts }: { parts: string[] }) {
  return (
    <small className={s.meta}>
      {parts.map((p, i) => (
        <span key={i}>{p}</span>
      ))}
    </small>
  );
}

function personMeta(r: RosterRow, threshold: number | null, now: Date): string[] {
  const parts = [`${shortDate(new Date(r.appliedAt))} 신청`];
  if (r.orderNo && r.orderStatus && r.orderDueAt) {
    const badge = orderBadge(
      { status: r.orderStatus, dueAt: r.orderDueAt },
      now,
      ORDER_STATUS_LABELS,
    );
    parts.push(r.orderNo, badge.label);
  }
  const progress = progressText(r, threshold);
  if (progress) parts.push(progress);
  return parts;
}

function AttendanceButtons({
  a,
  r,
  canCheck,
}: {
  a: HostActivityDetail;
  r: RosterRow;
  canCheck: boolean;
}) {
  if (!canCheck) {
    return r.attendance ? (
      <StatusBadge status={r.attendance} label={r.attendance === "attended" ? "참석" : "불참"} />
    ) : null;
  }
  return (
    <form action={attendanceAction} className={s.buttons} aria-label={`${r.nickname} 출석`}>
      <input type="hidden" name="activityId" value={a.id} />
      <input type="hidden" name="userId" value={r.userId} />
      {(["attended", "absent"] as const).map((st) => (
        <SubmitButton
          key={st}
          className={r.attendance === st ? s.primarySmall : s.ghostSmall}
          name="status"
          value={st}
          pressed={r.attendance === st}
          pendingLabel="기록 중…"
        >
          {st === "attended" ? "참석" : "불참"}
        </SubmitButton>
      ))}
    </form>
  );
}

function Money({ a, now }: { a: HostActivityDetail; now: Date }) {
  const m = moneySummary(a.orders, now);
  return (
    <section className={s.section} aria-labelledby="money-h">
      <h2 id="money-h">받은 돈과 환불</h2>
      <p className={s.hint}>
        참가자 주문에서 계산했어요. 입금 확인과 환불 송금은 운영진이 처리해요. 수수료와 지출까지 뺀
        남은 돈은 아래 장부에서 봐요.
      </p>
      <dl className={s.tiles}>
        <Tile label="받은 돈" value={won(m.received)} />
        <Tile label="송금한 환불" value={won(m.refunded)} />
        {m.refundOpen > 0 && <Tile label="처리 중 환불" value={won(m.refundOpen)} />}
        {m.pending > 0 && <Tile label="입금 대기" value={won(m.pending)} />}
      </dl>
      {a.orders.length === 0 ? (
        <EmptyState title="아직 주문이 없어요" />
      ) : (
        <ul className={s.people} aria-label="주문">
          {a.orders.map((o) => (
            <li key={o.orderNo} className={s.person}>
              <div className={s.who}>
                <strong>
                  {o.nickname} · {won(o.amount)}
                </strong>
                <Meta
                  parts={[
                    o.orderNo,
                    shortDate(new Date(o.createdAt)),
                    ...o.refunds.map(
                      (r) => `환불 ${won(r.amount)} ${REFUND_STATUS_LABELS[r.status] ?? r.status}`,
                    ),
                  ]}
                />
              </div>
              <StatusBadge {...orderBadge(o, now, ORDER_STATUS_LABELS)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Cover({
  a,
  assets,
  owners,
}: {
  a: HostActivityDetail;
  assets: MediaAsset[];
  owners: { value: string; label: string }[];
}) {
  return (
    <section className={s.section} id="cover" aria-labelledby="cover-h">
      <h2 id="cover-h">표지</h2>
      <div className={s.coverRow}>
        <div className={s.coverPreview} data-kind={a.kind}>
          {a.cover ? (
            <Image
              src={a.cover}
              unoptimized={isRemoteImage(a.cover)}
              alt="지금 표지"
              fill
              sizes="(min-width: 768px) 320px, 100vw"
            />
          ) : (
            <span aria-hidden="true">{a.title}</span>
          )}
        </div>
        <p className={s.hint}>
          {a.cover
            ? "목록 카드 · 활동 화면 · 공유 미리보기에 이 사진이 보여요."
            : "표지가 없어서 종류 색과 제목으로 된 기본 표지가 보여요."}
        </p>
      </div>

      <details className={s.coverEdit}>
        <summary>표지 바꾸기</summary>
        {assets.length > 0 && (
          <form action={setCoverAction} className={s.pick}>
            <input type="hidden" name="activityId" value={a.id} />
            <fieldset>
              <legend>보관함에서 고르기</legend>
              <div className={s.pickGrid}>
                {assets.map((m) => (
                  <label key={m.id}>
                    <input
                      type="radio"
                      name="mediaId"
                      value={m.id}
                      required
                      defaultChecked={a.cover === m.url}
                    />
                    <span className={s.pickThumb}>
                      <Image
                        src={m.url}
                        alt={m.alt || "설명 없는 이미지"}
                        fill
                        unoptimized
                        sizes="160px"
                      />
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <SubmitButton className={s.primarySmall} pendingLabel="바꾸는 중…">
              이 사진으로 표지 바꾸기
            </SubmitButton>
          </form>
        )}

        <form action={uploadCoverAction} className={s.pick} aria-label="새 사진 올려 표지로 쓰기">
          <input type="hidden" name="activityId" value={a.id} />
          <p className={s.subTitle}>새 사진 올려 표지로 쓰기</p>
          <MediaUploadFields owners={owners} idPrefix="cover" />
          <SubmitButton className={s.primarySmall} pendingLabel="올리는 중…">
            올리고 표지로 쓰기
          </SubmitButton>
        </form>

        {a.cover && (
          <form action={setCoverAction}>
            <input type="hidden" name="activityId" value={a.id} />
            <input type="hidden" name="mediaId" value="" />
            <SubmitButton className={s.ghostSmall} pendingLabel="빼는 중…">
              표지 빼기
            </SubmitButton>
          </form>
        )}
      </details>
    </section>
  );
}

type OpenLedger = Exclude<Ledger, { access: "none" }>;

function LedgerSection({
  a,
  ledger,
  today,
}: {
  a: HostActivityDetail;
  ledger: OpenLedger;
  today: string;
}) {
  const p = ledger.payout;
  return (
    <section className={s.section} id="ledger" aria-labelledby="ledger-h">
      <h2 id="ledger-h">장부</h2>
      <form action={ledgerPublicAction} className={s.ledgerVisibility}>
        <input type="hidden" name="activityId" value={a.id} />
        <input type="hidden" name="public" value={String(!ledger.public)} />
        <p>
          {ledger.public
            ? "확정된 참가자에게 공개 중이에요. 참가자는 합계와 항목을 보고, 영수증 사진은 보지 않아요."
            : "지금은 이 활동을 관리하는 사람만 봐요."}
        </p>
        <SubmitButton className={s.ghostSmall} pendingLabel="바꾸는 중…">
          {ledger.public ? "공개 그만하기" : "참가자에게 공개"}
        </SubmitButton>
      </form>

      <LedgerStatement ledger={ledger} />
      {p && p.total !== 0 && (
        <p className={s.hint}>
          참가비에서 환불과 수수료를 뺀 {won(p.total)}을 정산으로 받아요 · 지급 완료{" "}
          {won(p.settled)} · 정산 예정 {won(p.scheduled)} · 아직 정산 전 {won(p.unsettled)}.
          수수료는 주문에 적힌 비율로 계산해요.{" "}
          <Link href="/host/settlements" className={s.inlineLink}>
            정산 화면에서 보기
          </Link>
        </p>
      )}

      {ledger.entries.length > 0 && (
        <ul className={s.people} aria-label="장부 항목">
          {ledger.entries.map((e) => (
            <li key={e.id} className={s.person}>
              <div className={s.who}>
                <strong>
                  {e.memo} · {e.kind === "income" ? "+" : "−"} {won(e.amount)}
                </strong>
                <Meta parts={[entryMeta(e), ...(e.createdBy ? [`${e.createdBy} 적음`] : [])]} />
                {e.receiptPath && (
                  <a
                    href={mediaUrl(e.receiptPath)}
                    target="_blank"
                    rel="noreferrer"
                    className={s.textLink}
                  >
                    영수증 보기
                  </a>
                )}
              </div>
              <form
                action={deleteLedgerAction}
                aria-label={`${e.memo} 지우기`}
                className={s.buttons}
              >
                <input type="hidden" name="activityId" value={a.id} />
                <input type="hidden" name="entryId" value={e.id} />
                <SubmitButton className={s.ghostSmall} pendingLabel="지우는 중…">
                  지우기
                </SubmitButton>
              </form>
              <details className={s.entryEdit}>
                <summary>고치기</summary>
                <LedgerForm a={a} today={today} entry={e} />
              </details>
            </li>
          ))}
        </ul>
      )}

      <details className={s.ledgerAdd} open={ledger.entries.length === 0}>
        <summary>지출 · 수입 적기</summary>
        <LedgerForm a={a} today={today} />
      </details>

      {ledger.history.length > 0 && (
        <details className={s.history}>
          <summary>고친 기록 {ledger.history.length}</summary>
          <ol>
            {ledger.history.map((h, i) => (
              <li key={i}>
                <span>{h.text}</span>
                <small>
                  {h.actor ?? "알 수 없음"} · {shortDate(new Date(h.at))}{" "}
                  {clockTime(new Date(h.at))}
                </small>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

function LedgerForm({
  a,
  today,
  entry,
}: {
  a: HostActivityDetail;
  today: string;
  entry?: OpenLedger["entries"][number];
}) {
  return (
    <form
      action={saveLedgerAction}
      className={s.ledgerForm}
      aria-label={entry ? `${entry.memo} 고치기` : "장부에 적기"}
    >
      <input type="hidden" name="activityId" value={a.id} />
      {entry && <input type="hidden" name="entryId" value={entry.id} />}
      <fieldset className={s.kindPick}>
        <legend>종류</legend>
        {(["expense", "income"] as const).map((k) => (
          <label key={k}>
            <input
              type="radio"
              name="kind"
              value={k}
              defaultChecked={(entry?.kind ?? "expense") === k}
            />
            <span>{k === "expense" ? "지출" : "기타 수입"}</span>
          </label>
        ))}
      </fieldset>
      <label className={s.formField}>
        <span>항목</span>
        <input
          name="memo"
          required
          maxLength={60}
          defaultValue={entry?.memo}
          placeholder="예: 스터디룸 대관"
        />
      </label>
      <label className={s.formField}>
        <span>금액 (원)</span>
        <input
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          max={100000000}
          required
          defaultValue={entry?.amount}
        />
      </label>
      <label className={s.formField}>
        <span>날짜</span>
        <input name="occurredOn" type="date" required defaultValue={entry?.occurredOn ?? today} />
      </label>
      <label className={s.formField}>
        <span>{entry?.receiptPath ? "영수증 바꾸기 (선택)" : "영수증 사진 (선택)"}</span>
        <input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <SubmitButton className={s.primarySmall} pendingLabel="적는 중…">
        {entry ? "고친 내용 저장" : "장부에 적기"}
      </SubmitButton>
    </form>
  );
}

function CalloutSection({
  a,
  sent,
  sources,
}: {
  a: HostActivityDetail;
  sent: SentCallout | null;
  sources: { id: string; title: string; kind: string; confirmed: number }[];
}) {
  const open = a.status === "open" || a.status === "in_progress";
  return (
    <section className={s.section} id="callout" aria-labelledby="callout-h">
      <h2 id="callout-h">지난 참가자에게 알리기</h2>
      {sent ? (
        <div className={s.person}>
          <div className={s.who}>
            <strong>알렸어요</strong>
            <Meta
              parts={[
                `${shortDate(new Date(sent.createdAt))} ${clockTime(new Date(sent.createdAt))}`,
                `받은 ${sent.recipients}명 · 읽은 ${sent.read}명`,
              ]}
            />
            {sent.message && <p className={s.noticeBody}>{sent.message}</p>}
          </div>
        </div>
      ) : !open ? (
        <p className={s.hint}>
          공개한 뒤에 내가 연 지난 활동의 참가자에게 이 활동을 알릴 수 있어요.
        </p>
      ) : sources.length === 0 ? (
        <p className={s.hint}>
          알릴 지난 활동이 없어요. 확정된 참가자가 있는 활동을 열면 여기서 고를 수 있어요.
        </p>
      ) : (
        <form
          action={sendCalloutAction}
          className={s.noticeForm}
          aria-label="지난 참가자에게 알리기"
        >
          <input type="hidden" name="activityId" value={a.id} />
          <fieldset className={`${s.sourcePick} ${s.wideField}`}>
            <legend>어느 활동의 참가자에게</legend>
            {sources.map((x) => (
              <label key={x.id}>
                <input type="checkbox" name="sources" value={x.id} />
                <span>
                  {x.title} <small>확정 {x.confirmed}명</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className={`${s.formField} ${s.wideField}`}>
            <span>한마디 (선택)</span>
            <textarea
              name="message"
              maxLength={300}
              rows={3}
              placeholder="예: 지난번에 와 주셔서 고마워요. 이번엔 이런 걸 해요."
            />
          </label>
          <p className={s.hint}>
            받은 사람은 &apos;나&apos; 화면의 받은 소식에서 봐요. 소식을 끈 사람, 나를 끈 사람, 이미
            신청한 사람은 빠지고, 이 활동에서는 한 번만 보낼 수 있어요.
          </p>
          <SubmitButton className={s.primarySmall} pendingLabel="알리는 중…">
            알리기
          </SubmitButton>
        </form>
      )}
    </section>
  );
}
