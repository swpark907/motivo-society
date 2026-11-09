import type { ActivityKind } from "./explore-filters";
import type { HostActivity, HostActivityStatus } from "./host-view";
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
