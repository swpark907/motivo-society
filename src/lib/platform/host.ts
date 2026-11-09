import type { ActivityKind } from "./explore-filters";
import type { CreateOptions } from "./activity-draft";
import type { Json } from "./database.types";
import type { MoneyOrder, ParticipationStatus, RosterRow } from "./host-activity-view";
import type { HostActivity, HostActivityStatus } from "./host-view";
import { errorCodeFrom } from "./messages";
import { kstDateKey } from "./schedule";
import { createSessionClient, sandboxEnv } from "./supabase-server";

// 호스트 도구의 데이터. 누가 들어오는지와 관리 범위는 DB가 정한다(host_access · host_my_activities).

export type HostAccess = {
  eligible: boolean;
  hostTier: "basic" | "paid" | null;
  clubCreate: boolean;
  official: boolean;
  managed: number;
};

const NO_ACCESS: HostAccess = {
  eligible: false,
  hostTier: null,
  clubCreate: false,
  official: false,
  managed: 0,
};

export async function getHostAccess(): Promise<HostAccess> {
  if (!sandboxEnv()) return NO_ACCESS;
  const supabase = await createSessionClient();
  const { data } = await supabase.rpc("host_access");
  const j = (data ?? {}) as Record<string, unknown>;
  return {
    eligible: j.eligible === true,
    hostTier: j.host_tier === "paid" || j.host_tier === "basic" ? j.host_tier : null,
    clubCreate: j.club_create === true,
    official: j.official === true,
    managed: typeof j.managed === "number" ? j.managed : 0,
  };
}

/** 내가 관리하는 활동 전부(지난 것·취소된 것 포함), 참가 현황과 함께. */
export async function listHostActivities(now = new Date()): Promise<HostActivity[]> {
  const supabase = await createSessionClient();
  const { data: idRows } = await supabase.rpc("host_my_activities");
  const ids = (idRows ?? []) as string[];
  if (ids.length === 0) return [];

  const [{ data: acts }, { data: parts }, { data: sessions }] = await Promise.all([
    supabase
      .from("activities")
      .select(
        "id, slug, kind, title, status, starts_at, ends_at, club_id, capacity, price, cover_path, clubs(name)",
      )
      .in("id", ids),
    supabase.from("participations").select("activity_id, status").in("activity_id", ids),
    supabase
      .from("activities")
      .select("series_id, starts_at, status")
      .in("series_id", ids)
      .neq("status", "cancelled"),
  ]);

  const today = kstDateKey(now);
  const count = (id: string, status: string) =>
    (parts ?? []).filter((p) => p.activity_id === id && p.status === status).length;
  const sessionToday = new Set(
    (sessions ?? [])
      .filter((x) => x.starts_at && kstDateKey(new Date(x.starts_at)) === today)
      .map((x) => x.series_id),
  );

  return (acts ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    kind: a.kind as ActivityKind,
    title: a.title,
    status: a.status as HostActivityStatus,
    startsAt: a.starts_at,
    endsAt: a.ends_at,
    clubId: a.club_id,
    clubName: a.clubs?.name ?? null,
    capacity: a.capacity,
    price: a.price,
    cover: a.cover_path,
    confirmed: count(a.id, "confirmed"),
    waitlisted: count(a.id, "waitlisted"),
    pendingApproval: count(a.id, "pending_approval"),
    pendingPayment: count(a.id, "pending_payment"),
    meetsToday:
      (a.kind === "gathering" && !!a.starts_at && kstDateKey(new Date(a.starts_at)) === today) ||
      sessionToday.has(a.id),
  }));
}

// ─────────────────────────────────────────────── 활동 하나의 관리 화면(H02)

export type HostSession = {
  id: string;
  no: number;
  title: string;
  startsAt: string | null;
  status: HostActivityStatus;
  attended: number;
};

export type HostActivityDetail = {
  id: string;
  slug: string;
  kind: ActivityKind;
  title: string;
  status: HostActivityStatus;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number | null;
  price: number;
  joinMode: "instant" | "approval";
  clubName: string | null;
  place: string | null;
  /** 회차면 소속 시즌 */
  series: { id: string; title: string } | null;
  sessionNo: number | null;
  roster: RosterRow[];
  /** 시즌이면 회차 목록 */
  sessions: HostSession[];
  /** 챌린지 완주 조건(인정된 인증 수) */
  threshold: number | null;
  orders: MoneyOrder[];
};

export type HostActivityResult =
  | { found: false }
  | { found: true; canManage: false }
  | { found: true; canManage: true; activity: HostActivityDetail };

/**
 * 관리 화면에 필요한 것 전부. 읽을 수 없으면 found:false, 읽을 수는 있지만 관리 권한이 없으면 canManage:false.
 * 지난 활동도 같은 모양으로 그때의 명단·출석·돈이 그대로 나온다.
 */
export async function getHostActivity(id: string): Promise<HostActivityResult> {
  const supabase = await createSessionClient();
  // 관리 권한은 활동과 함께 묻는다(읽을 수 없으면 어차피 found:false).
  const [{ data: a }, { data: manage }] = await Promise.all([
    supabase
      .from("activities")
      .select(
        "id, slug, kind, title, status, starts_at, ends_at, capacity, price, join_mode, series_id, session_no, clubs(name), series:series_id(id, title), gathering_details(format, place_name, area)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.rpc("can_manage_activity", { p_activity: id }),
  ]);
  if (!a) return { found: false };
  if (!manage) return { found: true, canManage: false };

  const isSession = a.series_id !== null;
  const rosterOf = a.series_id ?? id;
  const [parts, attendance, season, progress, sessions, challenge, orders] = await Promise.all([
    supabase
      .from("participations")
      .select(
        "id, user_id, status, created_at, outcome, profile:profiles!participations_user_id_fkey(nickname), order:orders!participations_order_id_fkey(order_no, status, due_at)",
      )
      .eq("activity_id", rosterOf),
    a.kind === "gathering"
      ? supabase.from("attendances").select("user_id, status").eq("gathering_id", id)
      : Promise.resolve({ data: [] as { user_id: string; status: string }[] }),
    a.kind === "series"
      ? supabase.rpc("series_attendance", { p_series: id })
      : Promise.resolve({ data: [] as { user_id: string; attended: number; held: number }[] }),
    a.kind === "challenge"
      ? supabase.rpc("challenge_progress", { p_activity: id })
      : Promise.resolve({ data: [] as { user_id: string; accepted: number }[] }),
    a.kind === "series"
      ? supabase
          .from("activities")
          .select("id, session_no, title, starts_at, status")
          .eq("series_id", id)
          .order("session_no")
      : Promise.resolve({ data: [] as never[] }),
    a.kind === "challenge"
      ? supabase
          .from("challenge_details")
          .select("completion_threshold")
          .eq("activity_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isSession
      ? Promise.resolve({ data: [] as never[] })
      : supabase
          .from("orders")
          .select(
            "order_no, amount, status, created_at, due_at, buyer:profiles!orders_user_id_fkey(nickname), refunds(amount, status)",
          )
          .eq("activity_id", id)
          .order("created_at"),
  ]);

  const sessionRows = (sessions.data ?? []) as {
    id: string;
    session_no: number | null;
    title: string;
    starts_at: string | null;
    status: string;
  }[];
  const sessionAttendance = sessionRows.length
    ? ((
        await supabase
          .from("attendances")
          .select("gathering_id")
          .in(
            "gathering_id",
            sessionRows.map((x) => x.id),
          )
          .eq("status", "attended")
      ).data ?? [])
    : [];

  const attendanceBy = new Map((attendance.data ?? []).map((r) => [r.user_id, r.status]));
  const seasonBy = new Map((season.data ?? []).map((r) => [r.user_id, r]));
  const progressBy = new Map((progress.data ?? []).map((r) => [r.user_id, r.accepted]));

  const roster: RosterRow[] = (parts.data ?? [])
    // 회차 명단은 시즌에 확정된 사람이다.
    .filter((p) => !isSession || p.status === "confirmed")
    .map((p) => {
      const s = seasonBy.get(p.user_id);
      const confirmed = p.status === "confirmed";
      const att = attendanceBy.get(p.user_id);
      return {
        participationId: p.id,
        userId: p.user_id,
        nickname: p.profile?.nickname ?? "이름 없음",
        status: p.status as ParticipationStatus,
        appliedAt: p.created_at,
        orderNo: p.order?.order_no ?? null,
        orderStatus: p.order?.status ?? null,
        orderDueAt: p.order?.due_at ?? null,
        attendance: att === "attended" || att === "absent" ? att : null,
        seasonAttended: a.kind === "series" && confirmed ? (s?.attended ?? 0) : null,
        seasonHeld: a.kind === "series" && confirmed ? (s?.held ?? 0) : null,
        accepted: a.kind === "challenge" && confirmed ? (progressBy.get(p.user_id) ?? 0) : null,
        outcome: p.outcome === "completed" || p.outcome === "incomplete" ? p.outcome : null,
      };
    });

  const g = a.gathering_details;
  return {
    found: true,
    canManage: true,
    activity: {
      id: a.id,
      slug: a.slug,
      kind: a.kind as ActivityKind,
      title: a.title,
      status: a.status as HostActivityStatus,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      capacity: a.capacity,
      price: a.price,
      joinMode: a.join_mode === "approval" ? "approval" : "instant",
      clubName: a.clubs?.name ?? null,
      place: !g
        ? null
        : g.format === "online"
          ? "온라인"
          : [g.place_name, g.area].filter(Boolean).join(" · ") || null,
      series: a.series ? { id: a.series.id, title: a.series.title } : null,
      sessionNo: a.session_no,
      roster,
      sessions: sessionRows.map((x) => ({
        id: x.id,
        no: x.session_no ?? 0,
        title: x.title,
        startsAt: x.starts_at,
        status: x.status as HostActivityStatus,
        attended: sessionAttendance.filter((r) => r.gathering_id === x.id).length,
      })),
      threshold: challenge.data?.completion_threshold ?? null,
      orders: (orders.data ?? []).map((o) => ({
        orderNo: o.order_no,
        nickname: o.buyer?.nickname ?? "이름 없음",
        amount: o.amount,
        status: o.status,
        createdAt: o.created_at,
        dueAt: o.due_at,
        refunds: o.refunds ?? [],
      })),
    },
  };
}

// 관리 동작. 권한·정원·시각은 DB 함수가 다시 확인한다. 실패하면 오류 코드를 돌려준다.

export async function publishHostActivity(
  id: string,
): Promise<{ error: string } | { status: string }> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("activity_publish", { p_activity: id });
  return error ? { error: errorCodeFrom(error.message) } : { status: String(data) };
}

export async function decideHostParticipation(
  participationId: string,
  approve: boolean,
): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("participation_decide", {
    p_participation: participationId,
    p_approve: approve,
  });
  return error ? errorCodeFrom(error.message) : null;
}

export async function markHostAttendance(
  activityId: string,
  userId: string,
  status: "attended" | "absent",
): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("attendance_mark", {
    p_activity: activityId,
    p_user: userId,
    p_status: status,
  });
  return error ? errorCodeFrom(error.message) : null;
}

export async function finalizeHostChallenge(activityId: string): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("challenge_finalize", { p_activity: activityId });
  return error ? errorCodeFrom(error.message) : null;
}

// ─────────────────────────────────────────────── 활동 만들기(H03)

/** 내가 고를 수 있는 주최(DB가 정한다). */
export async function getCreateOptions(): Promise<CreateOptions> {
  const supabase = await createSessionClient();
  const { data } = await supabase.rpc("activity_create_options");
  const j = (data ?? {}) as {
    host_tier?: string | null;
    official?: boolean;
    clubs?: { id: string; name: string; paid_hosts?: { id: string; nickname: string }[] }[];
  };
  return {
    hostTier: j.host_tier === "paid" || j.host_tier === "basic" ? j.host_tier : null,
    official: j.official === true,
    clubs: (j.clubs ?? []).map((c) => ({ id: c.id, name: c.name, paidHosts: c.paid_hosts ?? [] })),
  };
}

/** 초안으로 만든다. 성공하면 새 활동 id, 실패하면 DB 오류 코드. */
export async function createHostActivity(
  payload: Record<string, unknown>,
): Promise<{ id: string } | { error: string }> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("activity_create", { p: payload as Json });
  if (error || typeof data !== "string") return { error: errorCodeFrom(error?.message) };
  return { id: data };
}
