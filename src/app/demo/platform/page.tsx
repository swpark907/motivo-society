import Link from "next/link";
import {
  ACTIVITY_STATUS_LABELS,
  KIND_LABELS,
  ORGANIZER_LABELS,
  PARTICIPATION_LABELS,
} from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { formatWhen, getViewer } from "./_data";
import { Badge, Notice, type SearchParams } from "./_ui";
import styles from "./sandbox.module.scss";

export default async function ActivityListPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createSessionClient();
  const viewer = await getViewer();

  const { data: activities, error } = await supabase
    .from("activities")
    .select(
      "id, kind, organizer_kind, title, summary, status, audience, join_mode, capacity, price, starts_at, visibility, gathering_details(format, area), clubs(name), creator:profiles!activities_created_by_fkey(nickname)",
    )
    .is("series_id", null) // 회차는 시즌 상세에서 본다
    .order("starts_at", { ascending: true });

  const ids = (activities ?? []).map((a) => a.id);
  const [{ data: counts }, { data: mine }, manageable] = await Promise.all([
    supabase.rpc("activity_seat_counts", { p_ids: ids }),
    viewer
      ? supabase.from("participations").select("activity_id, status").eq("user_id", viewer.id)
      : Promise.resolve({ data: [] as { activity_id: string; status: string }[] }),
    Promise.all(
      ids.map(async (id) => {
        const { data } = await supabase.rpc("can_manage_activity", { p_activity: id });
        return [id, Boolean(data)] as const;
      }),
    ),
  ]);
  const countBy = new Map((counts ?? []).map((c) => [c.activity_id, c]));
  const myStatus = new Map((mine ?? []).map((p) => [p.activity_id, p.status]));
  const canManage = new Map(manageable);

  return (
    <>
      <Notice searchParams={searchParams} />
      <div className={styles.pageHead}>
        <h1 className={styles.title}>활동 목록</h1>
        <p className={styles.muted}>
          {viewer ? `${viewer.nickname}(으)로 보고 있어요.` : "비회원으로 보고 있어요."}{" "}
          모임·시즌·챌린지가 한 목록에 일정 순으로 쌓여요. 보이는 범위는 DB 접근 규칙이 정해요.
        </p>
      </div>
      {error && <p className={styles.noticeError}>목록을 읽지 못했어요: {error.message}</p>}
      <ul className={styles.cards}>
        {(activities ?? []).map((a) => {
          const c = countBy.get(a.id);
          const status = myStatus.get(a.id);
          return (
            <li key={a.id} className={styles.card}>
              <Link href={`/demo/platform/activities/${a.id}`} className={styles.cardLink}>
                <div className={styles.chips}>
                  <span className={styles.chip}>{KIND_LABELS[a.kind]}</span>
                  <span className={styles.chip}>{ORGANIZER_LABELS[a.organizer_kind]}</span>
                  <Badge status={a.status} label={ACTIVITY_STATUS_LABELS[a.status]} />
                  {a.audience === "club_members" && <span className={styles.chip}>멤버 전용</span>}
                  {a.join_mode === "approval" && <span className={styles.chip}>승인제</span>}
                  {canManage.get(a.id) && <span className={styles.chipAccent}>내가 관리</span>}
                </div>
                <h2 className={styles.cardTitle}>{a.title}</h2>
                <p className={styles.muted}>{a.summary}</p>
                <dl className={styles.meta}>
                  <div>
                    <dt>일정</dt>
                    <dd>{formatWhen(a.starts_at)}</dd>
                  </div>
                  <div>
                    <dt>장소</dt>
                    <dd>{a.gathering_details?.area ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>주최</dt>
                    <dd>{a.clubs?.name ?? a.creator?.nickname}</dd>
                  </div>
                  <div>
                    <dt>자리</dt>
                    <dd>
                      {c?.taken ?? 0}/{a.capacity ?? "∞"}
                      {c?.waitlisted ? ` · 대기 ${c.waitlisted}` : ""}
                    </dd>
                  </div>
                </dl>
                {status && (
                  <p className={styles.myStatus}>
                    내 상태: <Badge status={status} label={PARTICIPATION_LABELS[status]} />
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
