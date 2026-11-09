import type { ActivityKind } from "./explore-filters";
import { videoState, type ParticipationStatus, type ScheduleRow } from "./schedule";
import { createSessionClient } from "./supabase-server";

// 내 일정의 데이터: 내가 신청한 모임·시즌(회차마다)·챌린지(기간 하나).
// 취소한 신청은 빼고, 대기·입금 대기는 다가오는 일정에 상태와 함께 보인다.

type Place = { format: string; place_name: string | null; area: string | null } | null;

function placeOf(g: Place) {
  return {
    online: g?.format === "online",
    place: g ? (g.format === "online" ? "온라인" : (g.place_name ?? g.area)) : null,
  };
}

/** "4주 바이브코딩 시즌 2회차 · 첫 화면" → "2회차 · 첫 화면" */
export function sessionSub(no: number | null, title: string, seriesTitle: string): string {
  const rest = title
    .replace(seriesTitle, "")
    .replace(/^\s*\d+회차\s*·?\s*/, "")
    .trim();
  const head = no ? `${no}회차` : "회차";
  return rest ? `${head} · ${rest}` : head;
}

export async function getMySchedule(
  userId: string,
  now = new Date(),
): Promise<{ rows: ScheduleRow[]; videoUrls: Map<string, string> }> {
  const supabase = await createSessionClient();
  const { data: parts } = await supabase
    .from("participations")
    .select(
      "status, activity:activities(id, slug, kind, title, starts_at, ends_at, status, gathering_details(format, place_name, area))",
    )
    .eq("user_id", userId)
    .neq("status", "cancelled");
  const mine = (parts ?? []).filter(
    (p) => p.activity && p.activity.status !== "draft" && p.activity.status !== "cancelled",
  );
  const seriesIds = mine.filter((p) => p.activity!.kind === "series").map((p) => p.activity!.id);
  const challengeIds = mine
    .filter((p) => p.activity!.kind === "challenge" && p.status === "confirmed")
    .map((p) => p.activity!.id);

  const [sessions, attendances, progress] = await Promise.all([
    seriesIds.length
      ? supabase
          .from("activities")
          .select(
            "id, series_id, session_no, title, starts_at, ends_at, gathering_details(format, place_name, area)",
          )
          .in("series_id", seriesIds)
          .neq("status", "cancelled")
          .order("session_no")
      : Promise.resolve({ data: [] }),
    supabase.from("attendances").select("gathering_id, status").eq("user_id", userId),
    Promise.all(
      challengeIds.map(async (id) => {
        const [{ data: rows }, { data: detail }] = await Promise.all([
          supabase.rpc("challenge_progress", { p_activity: id }),
          supabase
            .from("challenge_details")
            .select("completion_threshold")
            .eq("activity_id", id)
            .maybeSingle(),
        ]);
        const me = (rows ?? []).find((r) => r.user_id === userId);
        return [
          id,
          {
            accepted: me?.accepted ?? 0,
            threshold: detail?.completion_threshold ?? 0,
            outcome: me?.outcome ?? null,
          },
        ] as const;
      }),
    ),
  ]);
  const attended = new Map(
    (attendances.data ?? []).map((a) => [a.gathering_id, a.status as "attended" | "absent"]),
  );
  const progressById = new Map(progress);

  const rows: ScheduleRow[] = [];
  for (const p of mine) {
    const a = p.activity!;
    const status = p.status as ParticipationStatus;
    const base = {
      slug: a.slug,
      kind: a.kind as ActivityKind,
      title: a.title,
      status,
      attendance: null,
      challenge: null,
    };

    if (a.kind === "series") {
      const own = (sessions.data ?? []).filter((x) => x.series_id === a.id && x.starts_at);
      // 확정 전에는 회차를 펼치지 않고 시즌 하나로 보인다(가장 가까운 남은 회차 날짜).
      const shown =
        status === "confirmed"
          ? own
          : own.filter((x) => (x.ends_at ?? x.starts_at!) > now.toISOString()).slice(0, 1);
      for (const x of shown) {
        rows.push({
          ...base,
          key: `session-${x.id}`,
          activityId: x.id,
          sub: status === "confirmed" ? sessionSub(x.session_no, x.title, a.title) : null,
          startsAt: x.starts_at!,
          endsAt: x.ends_at,
          ...placeOf(x.gathering_details),
          attendance: attended.get(x.id) ?? null,
        });
      }
      continue;
    }

    if (!a.starts_at) continue;
    rows.push({
      ...base,
      key: `${a.kind}-${a.id}`,
      activityId: a.id,
      sub: null,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      ...(a.kind === "challenge" ? { online: true, place: null } : placeOf(a.gathering_details)),
      attendance: attended.get(a.id) ?? null,
      challenge: progressById.get(a.id) ?? null,
    });
  }

  // 화상 링크는 열린 것만 물어본다(시작 30분 전부터). 열림 판단은 DB가 다시 한다.
  const videoUrls = new Map<string, string>();
  const openRows = rows.filter((r) => videoState(r, now)?.kind === "open");
  await Promise.all(
    openRows.map(async (r) => {
      const { data } = await supabase.rpc("get_activity_private", { p_activity: r.activityId });
      const url = (data as { video_url?: string | null } | null)?.video_url;
      if (url) videoUrls.set(r.activityId, url);
    }),
  );

  return { rows, videoUrls };
}
