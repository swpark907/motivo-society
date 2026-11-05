import Link from "next/link";
import { ACTIVITY_STATUS_LABELS } from "@/lib/platform/messages";
import { createSessionClient } from "@/lib/platform/supabase-server";
import { formatWhen } from "../../_data";
import { Badge } from "../../_ui";
import styles from "../../sandbox.module.scss";

/** 시즌 상세: 회차 목록과 출석률. 참가는 시즌에 한 번, 출석은 회차마다 남는다. */
export async function SeriesSessions({
  seriesId,
  canManage,
}: {
  seriesId: string;
  canManage: boolean;
}) {
  const supabase = await createSessionClient();
  const [{ data: sessions }, { data: attendance }] = await Promise.all([
    supabase
      .from("activities")
      .select("id, session_no, title, starts_at, status")
      .eq("series_id", seriesId)
      .order("session_no"),
    supabase.rpc("series_attendance", { p_series: seriesId }),
  ]);

  return (
    <section className={styles.panel} aria-labelledby="sessions-heading">
      <h2 id="sessions-heading" className={styles.panelTitle}>
        회차 {sessions?.length ?? 0}개
      </h2>
      <p className={styles.muted}>
        시즌 일정은 첫 회차 시작부터 마지막 회차 종료까지로 자동 계산돼요. 회차를 누르면 링크와 출석
        체크가 있어요.
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">회차</th>
            <th scope="col">일정</th>
            <th scope="col">상태</th>
          </tr>
        </thead>
        <tbody>
          {(sessions ?? []).map((s) => (
            <tr key={s.id}>
              <td>
                <Link href={`/demo/platform/activities/${s.id}`}>{s.title}</Link>
              </td>
              <td className={styles.nowrap}>{formatWhen(s.starts_at)}</td>
              <td>
                {s.status === "open" ? (
                  <Badge status="scheduled" label="예정" />
                ) : (
                  <Badge status={s.status} label={ACTIVITY_STATUS_LABELS[s.status]} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(attendance ?? []).length > 0 && (
        <>
          <h3 className={styles.subTitle}>
            {canManage ? "참가자 출석률" : "내 출석률"} (이미 시작한 회차 기준)
          </h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">사람</th>
                <th scope="col">출석</th>
              </tr>
            </thead>
            <tbody>
              {(attendance ?? []).map((r) => (
                <tr key={r.user_id}>
                  <td>{r.nickname}</td>
                  <td>
                    {r.attended}/{r.held}회
                    {r.held > 0 ? ` (${Math.round((r.attended / r.held) * 100)}%)` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
