import Link from "next/link";
import {
  ACTIVITY_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PARTICIPATION_LABELS,
  won,
} from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { formatWhen, getViewer } from "../_data";
import { Badge, Notice, type SearchParams } from "../_ui";
import styles from "../sandbox.module.scss";

const ATTENDANCE_LABELS: Record<string, string> = { attended: "참석", absent: "불참" };
const SOURCE_LABELS: Record<string, string> = {
  order: "결제",
  free: "무료 참가",
  invite: "초대",
  grant: "운영 부여",
  completion: "수료",
  legacy: "기존 수강",
};

export default async function MyActivitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <>
        <Notice searchParams={searchParams} />
        <h1 className={styles.title}>내 활동</h1>
        <p className={styles.muted}>위에서 사람을 골라 로그인하면 내 신청과 출석이 보여요.</p>
      </>
    );
  }

  const supabase = await createSessionClient();
  const [{ data: parts }, { data: attendance }, { data: orders }, { data: entitlements }] =
    await Promise.all([
      supabase
        .from("participations")
        .select("id, status, activity:activities(id, title, starts_at, status)")
        .eq("user_id", viewer.id),
      supabase.from("attendances").select("gathering_id, status").eq("user_id", viewer.id),
      supabase
        .from("orders")
        .select("id, order_no, amount, status, created_at, activity:activities(title)")
        .eq("user_id", viewer.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("entitlements")
        .select("id, source, status, revoke_reason, activity:activities(title)")
        .eq("user_id", viewer.id)
        .order("created_at", { ascending: false }),
    ]);
  const attendanceBy = new Map((attendance ?? []).map((r) => [r.gathering_id, r.status]));
  const sorted = [...(parts ?? [])].sort((x, y) =>
    (x.activity?.starts_at ?? "").localeCompare(y.activity?.starts_at ?? ""),
  );

  return (
    <>
      <Notice searchParams={searchParams} />
      <h1 className={styles.title}>{viewer.nickname}의 활동</h1>
      <p className={styles.muted}>신청한 활동이 종류와 상관없이 일정 순으로 모여요.</p>
      {sorted.length === 0 ? (
        <p className={styles.muted}>아직 신청한 활동이 없어요.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">일정</th>
              <th scope="col">활동</th>
              <th scope="col">활동 상태</th>
              <th scope="col">내 신청</th>
              <th scope="col">출석</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <td>{formatWhen(p.activity?.starts_at ?? null)}</td>
                <td>
                  <Link href={`/demo/platform/activities/${p.activity?.id}`}>
                    {p.activity?.title}
                  </Link>
                </td>
                <td>
                  {p.activity ? (
                    <Badge
                      status={p.activity.status}
                      label={ACTIVITY_STATUS_LABELS[p.activity.status]}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <Badge status={p.status} label={PARTICIPATION_LABELS[p.status]} />
                </td>
                <td>
                  {attendanceBy.get(p.activity?.id ?? "") ? (
                    <Badge
                      status={attendanceBy.get(p.activity?.id ?? "")!}
                      label={ATTENDANCE_LABELS[attendanceBy.get(p.activity?.id ?? "")!]}
                    />
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <section className={styles.panel} aria-labelledby="orders-heading">
        <h2 id="orders-heading" className={styles.panelTitle}>
          내 주문
        </h2>
        {(orders ?? []).length === 0 ? (
          <p className={styles.muted}>주문이 없어요. 유료 활동에 신청하면 생겨요.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">주문</th>
                <th scope="col">활동</th>
                <th scope="col">금액</th>
                <th scope="col">상태</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((o) => (
                <tr key={o.id}>
                  <td className={styles.nowrap}>{o.order_no}</td>
                  <td>{o.activity?.title}</td>
                  <td className={styles.nowrap}>{won(o.amount)}</td>
                  <td>
                    <Badge status={o.status} label={ORDER_STATUS_LABELS[o.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="ent-heading">
        <h2 id="ent-heading" className={styles.panelTitle}>
          내 이용권
        </h2>
        <p className={styles.muted}>
          참가가 확정되면 무료든 유료든 이용권이 생겨요. &quot;이전 활동 참가자 전용&quot; 모임은 이
          이용권으로 신청 자격을 판정해요.
        </p>
        {(entitlements ?? []).length === 0 ? (
          <p className={styles.muted}>이용권이 없어요.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">활동</th>
                <th scope="col">출처</th>
                <th scope="col">상태</th>
              </tr>
            </thead>
            <tbody>
              {(entitlements ?? []).map((e) => (
                <tr key={e.id}>
                  <td>{e.activity?.title}</td>
                  <td>{SOURCE_LABELS[e.source] ?? e.source}</td>
                  <td>
                    <Badge
                      status={e.status}
                      label={e.status === "active" ? "유효" : `회수 (${e.revoke_reason ?? ""})`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
