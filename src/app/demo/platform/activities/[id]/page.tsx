import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ACTIVITY_STATUS_LABELS,
  KIND_LABELS,
  ORGANIZER_LABELS,
  ORDER_STATUS_LABELS,
  PARTICIPATION_LABELS,
} from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { decideParticipation, markAttendance, publishActivity } from "../../actions";
import { formatWhen, getViewer } from "../../_data";
import { Badge, Notice, ReturnTo, type SearchParams } from "../../_ui";
import styles from "../../sandbox.module.scss";
import { ChallengePanel } from "./ChallengePanel";
import { MyApplication } from "./MyApplication";
import { SeriesSessions } from "./SeriesSessions";

type PrivateInfo = {
  access: "none" | "participant" | "manager";
  address_detail?: string | null;
  video_url?: string | null;
  video_opens_at?: string;
};

export default async function ActivityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const path = `/demo/platform/activities/${id}`;
  const supabase = await createSessionClient();
  const viewer = await getViewer();

  const { data: a } = await supabase
    .from("activities")
    .select(
      "id, kind, series_id, session_no, allow_late_join, organizer_kind, title, summary, status, audience, join_mode, capacity, price, starts_at, ends_at, series:series_id(id, title), gathering_details(format, place_name, area, hide_address_until_confirmed), clubs(name), creator:profiles!activities_created_by_fkey(nickname)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!a) notFound();

  const [{ data: counts }, { data: manage }, { data: privateInfo }] = await Promise.all([
    supabase.rpc("activity_seat_counts", { p_ids: [id] }),
    supabase.rpc("can_manage_activity", { p_activity: id }),
    supabase.rpc("get_activity_private", { p_activity: id }),
  ]);
  const seat = counts?.[0];
  const priv = (privateInfo ?? { access: "none" }) as PrivateInfo;

  const { data: roster } = manage
    ? await supabase
        .from("participations")
        .select(
          "id, user_id, status, created_at, profile:profiles!participations_user_id_fkey(nickname), order:orders!participations_order_id_fkey(status)",
        )
        .eq("activity_id", a.series_id ?? id)
        .order("created_at")
    : { data: null };
  const { data: attendance } = manage
    ? await supabase.from("attendances").select("user_id, status").eq("gathering_id", id)
    : { data: null };
  const attendanceBy = new Map((attendance ?? []).map((r) => [r.user_id, r.status]));
  const g = a.gathering_details;
  const isGathering = a.kind === "gathering";
  const isSession = a.series_id !== null;

  return (
    <>
      <Notice searchParams={searchParams} />
      <p>
        <Link href="/demo/platform" className={styles.back}>
          ← 활동 목록
        </Link>
      </p>
      <div className={styles.chips}>
        <span className={styles.chip}>{KIND_LABELS[a.kind]}</span>
        <span className={styles.chip}>{ORGANIZER_LABELS[a.organizer_kind]}</span>
        {isSession && <span className={styles.chip}>{a.session_no}회차</span>}
        {isSession && a.status === "open" ? (
          <Badge status="scheduled" label="예정" />
        ) : (
          <Badge status={a.status} label={ACTIVITY_STATUS_LABELS[a.status]} />
        )}
        {a.audience === "club_members" && <span className={styles.chip}>멤버 전용</span>}
        {a.audience === "entitlement_holders" && (
          <span className={styles.chip}>이전 활동 참가자 전용</span>
        )}
        {a.join_mode === "approval" && <span className={styles.chip}>승인제</span>}
        {a.allow_late_join && <span className={styles.chip}>중도 합류 가능</span>}
      </div>
      {isSession && a.series && (
        <p className={styles.notice}>
          {a.session_no}회차예요. 신청은 회차마다 하지 않고{" "}
          <Link href={`/demo/platform/activities/${a.series.id}`}>{a.series.title}</Link>에 한 번
          등록해요.
        </p>
      )}
      <h1 className={styles.title}>{a.title}</h1>
      {a.status === "draft" && !isSession && (
        <div className={styles.notice}>
          {manage ? (
            <form action={publishActivity} className={styles.row}>
              <ReturnTo path={path} />
              <input type="hidden" name="activityId" value={id} />
              <p>초안이에요. 나와 관리 권한이 있는 사람에게만 보여요.</p>
              <button type="submit" className={styles.primaryButton}>
                공개하기
              </button>
            </form>
          ) : (
            <p>초안이에요.</p>
          )}
        </div>
      )}
      <p className={styles.muted}>{a.summary}</p>

      <dl className={styles.meta}>
        <div>
          <dt>일정</dt>
          <dd>
            {formatWhen(a.starts_at)} ~ {formatWhen(a.ends_at)}
          </dd>
        </div>
        <div>
          <dt>장소</dt>
          <dd>
            {!g
              ? "-"
              : g.format === "online"
                ? "온라인"
                : `${g.place_name ?? ""} · ${g.area ?? ""}`}
          </dd>
        </div>
        <div>
          <dt>주최</dt>
          <dd>{a.clubs?.name ?? a.creator?.nickname}</dd>
        </div>
        {!isSession && (
          <>
            <div>
              <dt>자리</dt>
              <dd>
                {seat?.taken ?? 0}/{a.capacity ?? "∞"}
                {seat?.waitlisted ? ` · 대기 ${seat.waitlisted}` : ""}
                {seat?.pending ? ` · 승인 대기 ${seat.pending}` : ""}
              </dd>
            </div>
            <div>
              <dt>참가비</dt>
              <dd>{a.price === 0 ? "무료" : `${a.price.toLocaleString("ko-KR")}원`}</dd>
            </div>
          </>
        )}
      </dl>

      <section className={styles.panel} aria-labelledby="my-heading">
        <h2 id="my-heading" className={styles.panelTitle}>
          내 신청
        </h2>
        {isSession ? (
          <p className={styles.muted}>
            {priv.access === "participant"
              ? "시즌에 등록되어 있어 이 회차에 참가해요."
              : "시즌에 등록하면 이 회차에 자동으로 참가해요."}
          </p>
        ) : (
          <MyApplication activityId={id} price={a.price} viewer={viewer} path={path} />
        )}
      </section>

      {a.kind === "series" && <SeriesSessions seriesId={id} canManage={Boolean(manage)} />}
      {a.kind === "challenge" && (
        <ChallengePanel activityId={id} canManage={Boolean(manage)} viewer={viewer} path={path} />
      )}

      {isGathering && (
        <section className={styles.panel} aria-labelledby="private-heading">
          <h2 id="private-heading" className={styles.panelTitle}>
            참가자에게만 보이는 정보
          </h2>
          {priv.access === "none" ? (
            <p className={styles.muted}>
              확정된 참가자와 진행자에게만 보여요.
              {g?.format === "offline" &&
                g.hide_address_until_confirmed &&
                " 상세 주소도 확정 후 공개돼요."}
            </p>
          ) : (
            <dl className={styles.meta}>
              <div>
                <dt>열람 자격</dt>
                <dd>{priv.access === "manager" ? "진행자" : "확정 참가자"}</dd>
              </div>
              {g?.format === "online" ? (
                <div>
                  <dt>화상 링크</dt>
                  <dd>
                    {priv.video_url ??
                      `시작 30분 전(${formatWhen(priv.video_opens_at ?? null)})부터 열려요`}
                  </dd>
                </div>
              ) : (
                <div>
                  <dt>상세 주소</dt>
                  <dd>{priv.address_detail ?? "-"}</dd>
                </div>
              )}
            </dl>
          )}
        </section>
      )}

      {manage && (
        <section className={styles.panel} aria-labelledby="roster-heading">
          <h2 id="roster-heading" className={styles.panelTitle}>
            명단 관리 <span className={styles.chipAccent}>관리 권한 있음</span>
          </h2>
          <p className={styles.muted}>
            승인·출석은 DB 함수가 권한과 정원을 다시 확인해요. 출석은 시작 1시간 전부터 체크할 수
            있어요.
            {isSession && " 회차 명단은 시즌 참가자예요."}
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">사람</th>
                <th scope="col">신청 상태</th>
                <th scope="col">결제</th>
                <th scope="col">처리</th>
                {isGathering && <th scope="col">출석</th>}
              </tr>
            </thead>
            <tbody>
              {(roster ?? []).map((p) => (
                <tr key={p.id}>
                  <td>{p.profile?.nickname}</td>
                  <td>
                    <Badge status={p.status} label={PARTICIPATION_LABELS[p.status]} />
                  </td>
                  <td>
                    {p.order ? (
                      <Badge status={p.order.status} label={ORDER_STATUS_LABELS[p.order.status]} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {p.status === "pending_approval" ? (
                      <div className={styles.inlineForms}>
                        {[true, false].map((approve) => (
                          <form key={String(approve)} action={decideParticipation}>
                            <ReturnTo path={path} />
                            <input type="hidden" name="participationId" value={p.id} />
                            <input type="hidden" name="approve" value={String(approve)} />
                            <button
                              type="submit"
                              className={approve ? styles.smallPrimary : styles.smallGhost}
                            >
                              {approve ? "승인" : "거절"}
                            </button>
                          </form>
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  {isGathering && (
                    <td>
                      {p.status === "confirmed" ? (
                        <div className={styles.inlineForms}>
                          {(["attended", "absent"] as const).map((s) => (
                            <form key={s} action={markAttendance}>
                              <ReturnTo path={path} />
                              <input type="hidden" name="activityId" value={id} />
                              <input type="hidden" name="userId" value={p.user_id} />
                              <input type="hidden" name="status" value={s} />
                              <button
                                type="submit"
                                className={
                                  attendanceBy.get(p.user_id) === s
                                    ? styles.smallPrimary
                                    : styles.smallGhost
                                }
                                aria-pressed={attendanceBy.get(p.user_id) === s}
                              >
                                {s === "attended" ? "참석" : "불참"}
                              </button>
                            </form>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
