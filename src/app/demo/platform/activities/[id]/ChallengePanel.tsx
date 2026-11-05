import { createSessionClient } from "@/lib/platform/supabase-server";
import { finalizeChallenge, rejectCertification, submitCertification } from "../../actions";
import type { Viewer } from "../../_data";
import { ReturnTo } from "../../_ui";
import styles from "../../sandbox.module.scss";

const RULE_LABELS: Record<string, string> = {
  daily: "매일 인증",
  weekly_n: "주 N회 인증",
  total_n: "기간 중 총 N회 인증",
};
const FORMAT_LABELS: Record<string, string> = { text: "글", photo: "사진", link: "링크" };

function kstToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function dayNumber(startsOn: string, date: string): number {
  return Math.round((Date.parse(date) - Date.parse(startsOn)) / 86_400_000) + 1;
}

/** 챌린지 상세: 규칙 · 오늘 미션 · 내 인증 · 현황판 · 인증 모아보기 · 진행자 반려 · 종료 판정. */
export async function ChallengePanel({
  activityId,
  canManage,
  viewer,
  path,
}: {
  activityId: string;
  canManage: boolean;
  viewer: Viewer;
  path: string;
}) {
  const supabase = await createSessionClient();
  const [{ data: d }, { data: missions }, { data: progress }, { data: certs }, { data: act }] =
    await Promise.all([
      supabase.from("challenge_details").select("*").eq("activity_id", activityId).maybeSingle(),
      supabase
        .from("challenge_missions")
        .select("id, day_no, title, body")
        .eq("activity_id", activityId),
      supabase.rpc("challenge_progress", { p_activity: activityId }),
      supabase
        .from("certifications")
        .select(
          "id, user_id, cert_date, body, link, status, rejected_reason, author:profiles!certifications_user_id_fkey(nickname)",
        )
        .eq("activity_id", activityId)
        .order("cert_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(40),
      supabase.from("activities").select("status").eq("id", activityId).maybeSingle(),
    ]);
  if (!d) return null;

  const today = kstToday();
  const todayNo = dayNumber(d.starts_on, today);
  const inPeriod = today >= d.starts_on && today <= d.ends_on;
  const ended = act?.status === "ended";
  const mission =
    missions?.find((m) => m.day_no === todayNo) ?? missions?.find((m) => m.day_no === null);
  const me = progress?.find((p) => p.user_id === viewer?.id);
  const myToday = certs?.find((c) => c.user_id === viewer?.id && c.cert_date === today);
  const isParticipant = Boolean(me);

  return (
    <section className={styles.panel} aria-labelledby="challenge-heading">
      <h2 id="challenge-heading" className={styles.panelTitle}>
        챌린지 {ended ? "· 종료" : inPeriod ? `· ${todayNo}일차` : ""}
      </h2>
      <dl className={styles.meta}>
        <div>
          <dt>기간</dt>
          <dd>
            {d.starts_on} ~ {d.ends_on}
          </dd>
        </div>
        <div>
          <dt>인증 규칙</dt>
          <dd>
            {RULE_LABELS[d.cert_rule]}
            {d.cert_n ? ` (${d.cert_n}회)` : ""} ·{" "}
            {d.cert_formats.map((f) => FORMAT_LABELS[f]).join("/")}
          </dd>
        </div>
        <div>
          <dt>완주 조건</dt>
          <dd>인정된 인증 {d.completion_threshold}회 이상</dd>
        </div>
        <div>
          <dt>인증 공개</dt>
          <dd>{d.certs_visibility === "participants" ? "참가자끼리 공개" : "진행자만"}</dd>
        </div>
      </dl>

      {isParticipant && (
        <div className={styles.subBlock}>
          <h3 className={styles.subTitle}>
            내 진행: {me?.accepted}/{d.completion_threshold}회
            {me?.outcome && ` · ${me.outcome === "completed" ? "완주" : "미완주"}`}
          </h3>
          {inPeriod && !ended && (
            <form action={submitCertification} className={styles.stack}>
              <ReturnTo path={path} />
              <input type="hidden" name="activityId" value={activityId} />
              {mission && (
                <p className={styles.muted}>
                  오늘 미션: <strong>{mission.title}</strong> {mission.body}
                </p>
              )}
              {d.cert_formats.includes("text") && (
                <label className={styles.field}>
                  <span>오늘 인증 ({today})</span>
                  <textarea
                    name="body"
                    rows={2}
                    maxLength={500}
                    defaultValue={myToday?.body ?? ""}
                  />
                </label>
              )}
              {d.cert_formats.includes("link") && (
                <label className={styles.field}>
                  <span>링크 (선택)</span>
                  <input name="link" type="url" defaultValue={myToday?.link ?? ""} />
                </label>
              )}
              <p className={styles.muted}>
                {myToday
                  ? myToday.status === "rejected"
                    ? `오늘 인증이 반려됐어요: ${myToday.rejected_reason}`
                    : "오늘 인증을 올렸어요. 오늘 안에는 고칠 수 있어요."
                  : "올리면 바로 인정돼요. 한국 시간 자정이 지나면 고칠 수 없어요. 사진 인증은 저장소를 붙일 때 열려요."}
              </p>
              <button type="submit" className={styles.primaryButton}>
                {myToday ? "오늘 인증 고치기" : "오늘 인증 올리기"}
              </button>
            </form>
          )}
        </div>
      )}
      {!isParticipant && viewer && !canManage && (
        <p className={styles.muted}>
          참가가 확정되면 인증을 올리고 다른 참가자의 인증을 볼 수 있어요.
        </p>
      )}

      {(progress ?? []).length > 0 && (
        <div className={styles.subBlock}>
          <h3 className={styles.subTitle}>현황판</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">참가자</th>
                <th scope="col">인정된 인증</th>
                <th scope="col">완주까지</th>
                <th scope="col">결과</th>
              </tr>
            </thead>
            <tbody>
              {(progress ?? []).map((p) => (
                <tr key={p.user_id}>
                  <td>{p.nickname}</td>
                  <td>{p.accepted}회</td>
                  <td>{Math.max(d.completion_threshold - p.accepted, 0)}회 남음</td>
                  <td>{p.outcome ? (p.outcome === "completed" ? "완주" : "미완주") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && !ended && (
        <form action={finalizeChallenge} className={styles.row}>
          <ReturnTo path={path} />
          <input type="hidden" name="activityId" value={activityId} />
          <p className={styles.muted}>
            종료일이 지나면 종료하고 완주를 판정할 수 있어요. 인정된 인증 수로 완주/미완주가
            정해져요.
          </p>
          <button type="submit" className={styles.ghostButton}>
            종료하고 완주 판정
          </button>
        </form>
      )}

      {(certs ?? []).length > 0 && (
        <div className={styles.subBlock}>
          <h3 className={styles.subTitle}>인증 모아보기</h3>
          <ul className={styles.certList}>
            {(certs ?? []).map((c) => (
              <li key={c.id} className={c.status === "rejected" ? styles.certRejected : undefined}>
                <div className={styles.certHead}>
                  <strong>{c.author?.nickname}</strong>
                  <span className={styles.muted}>
                    {c.cert_date} · {dayNumber(d.starts_on, c.cert_date)}일차
                  </span>
                  {c.status === "rejected" && (
                    <span className={styles.chipAccent}>반려: {c.rejected_reason}</span>
                  )}
                </div>
                {c.body && <p>{c.body}</p>}
                {c.link && <p className={styles.muted}>{c.link}</p>}
                {canManage && !ended && c.status === "accepted" && (
                  <form action={rejectCertification} className={styles.row}>
                    <ReturnTo path={path} />
                    <input type="hidden" name="certId" value={c.id} />
                    <label className={styles.field}>
                      <span>반려 사유</span>
                      <input name="reason" required maxLength={100} />
                    </label>
                    <button type="submit" className={styles.smallGhost}>
                      반려
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
