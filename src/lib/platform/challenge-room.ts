import {
  challengePhase,
  dayNoOf,
  dayStrip,
  missionFor,
  totalDays,
  type DayCell,
  type Phase,
} from "./challenge-days";
import { errorCodeFrom } from "./messages";
import { kstDateKey } from "./schedule";
import { createSessionClient } from "./supabase-server";

// 챌린지 상세 안의 참여자 영역: 오늘 미션 · 오늘 인증 · 내 진행 · 함께한 기록.
// 확정 참가자에게만 보인다(DB도 확정 참가자에게만 인증을 받고, 인증 목록을 연다).

export type MyCert = {
  body: string | null;
  link: string | null;
  status: "accepted" | "rejected";
  rejectedReason: string | null;
};

export type Companion = {
  userId: string;
  nickname: string;
  accepted: number;
  isMe: boolean;
  latest: { date: string; dayNo: number; body: string | null; link: string | null } | null;
};

export type ChallengeRoom = {
  today: string;
  phase: Phase;
  dayNo: number;
  totalDays: number;
  mission: { title: string; body: string | null } | null;
  todayCert: MyCert | null;
  days: DayCell[];
  accepted: number;
  threshold: number;
  rule: "daily" | "weekly_n" | "total_n";
  formats: string[];
  /** 다른 참가자의 인증 글을 볼 수 있는가(여는 사람만 보게 정한 챌린지면 숫자만). */
  certsVisible: boolean;
  companions: Companion[];
};

export async function getChallengeRoom(
  activityId: string,
  userId: string,
  now = new Date(),
): Promise<ChallengeRoom | null> {
  const supabase = await createSessionClient();
  const today = kstDateKey(now);

  const [{ data: d }, { data: missions }, { data: certs }, { data: progress }, { data: part }] =
    await Promise.all([
      supabase
        .from("challenge_details")
        .select(
          "starts_on, ends_on, cert_rule, cert_formats, completion_threshold, certs_visibility",
        )
        .eq("activity_id", activityId)
        .maybeSingle(),
      supabase
        .from("challenge_missions")
        .select("day_no, title, body")
        .eq("activity_id", activityId),
      // 내 것 + (보이면) 다른 사람 것. 읽기 정책이 범위를 정한다.
      supabase
        .from("certifications")
        .select("user_id, cert_date, body, link, status, rejected_reason")
        .eq("activity_id", activityId)
        .order("cert_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.rpc("challenge_progress", { p_activity: activityId }),
      supabase
        .from("participations")
        .select("created_at")
        .eq("activity_id", activityId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
  if (!d) return null;

  const rule = d.cert_rule as ChallengeRoom["rule"];
  const all = certs ?? [];
  const mine = all.filter((c) => c.user_id === userId);
  const todayRow = mine.find((c) => c.cert_date === today);
  const dayNo = dayNoOf(d.starts_on, today);
  // 합류한 날: 신청한 날과 내 가장 이른 인증 날 중 앞선 날(그 전 날은 "빠짐"으로 세지 않는다).
  const joinedOn = [
    part ? kstDateKey(new Date(part.created_at)) : null,
    ...mine.map((c) => c.cert_date),
  ]
    .filter((x): x is string => !!x)
    .reduce((a, b) => (b < a ? b : a), today);
  const mission = missionFor(
    (missions ?? []).map((m) => ({ dayNo: m.day_no, title: m.title, body: m.body })),
    dayNo,
  );

  // 함께한 기록: 사람마다 가장 최근의 인정된 인증 하나. 인증 수가 많은 순, 나는 맨 앞.
  const latestBy = new Map<string, (typeof all)[number]>();
  for (const c of all) {
    if (c.status === "accepted" && !latestBy.has(c.user_id)) latestBy.set(c.user_id, c);
  }
  const companions: Companion[] = (progress ?? [])
    .map((p) => {
      const last = latestBy.get(p.user_id);
      return {
        userId: p.user_id,
        nickname: p.nickname,
        accepted: p.accepted,
        isMe: p.user_id === userId,
        latest: last
          ? {
              date: last.cert_date,
              dayNo: dayNoOf(d.starts_on, last.cert_date),
              body: last.body,
              link: last.link,
            }
          : null,
      };
    })
    .sort((x, y) => Number(y.isMe) - Number(x.isMe) || y.accepted - x.accepted);
  const me = companions.find((c) => c.isMe);

  return {
    today,
    phase: challengePhase(d.starts_on, d.ends_on, today),
    dayNo,
    totalDays: totalDays(d.starts_on, d.ends_on),
    mission: mission ? { title: mission.title, body: mission.body } : null,
    todayCert: todayRow
      ? {
          body: todayRow.body,
          link: todayRow.link,
          status: todayRow.status as MyCert["status"],
          rejectedReason: todayRow.rejected_reason,
        }
      : null,
    days: dayStrip(
      d.starts_on,
      d.ends_on,
      today,
      mine.map((c) => ({ date: c.cert_date, status: c.status as MyCert["status"] })),
      rule,
      joinedOn,
    ),
    accepted: me?.accepted ?? 0,
    threshold: d.completion_threshold,
    rule,
    formats: d.cert_formats,
    certsVisible: d.certs_visibility === "participants",
    companions,
  };
}

/** 오늘 인증을 올리거나 고친다. 성공이면 null, 실패면 오류 코드. */
export async function submitCertification(
  activityId: string,
  body: string | null,
  link: string | null,
): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("certification_submit", {
    p_activity: activityId,
    p_body: body ?? undefined,
    p_link: link ?? undefined,
  });
  return error ? errorCodeFrom(error.message) : null;
}
