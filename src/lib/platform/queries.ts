import { createSessionClient, sandboxEnv } from "./supabase-server";

// 플랫폼 화면의 데이터 읽기는 여기서만 한다(페이지가 쿼리를 직접 쓰지 않는다).
// 읽기는 사용자 세션으로 하므로 DB의 접근 규칙(RLS)이 그대로 적용된다.

export type ActivityKind = "gathering" | "series" | "challenge";

export type ActivityCardData = {
  id: string;
  slug: string;
  kind: ActivityKind;
  title: string;
  summary: string | null;
  status: string;
  startsAt: string | null;
  area: string | null;
  online: boolean;
  price: number;
  capacity: number | null;
  taken: number;
  host: string;
  lateJoin: boolean;
};

/** 로컬 Supabase 연결 정보가 없으면(예: CI) 화면이 깨지지 않게 빈 결과와 함께 알린다. */
export type Result<T> = { available: boolean; items: T[] };

/** 발견에 보일 활동: 모집 중, 또는 진행 중이지만 중도 합류를 받는 것. 회차는 빼고 시즌으로 보인다. */
export async function listOpenActivities(): Promise<Result<ActivityCardData>> {
  if (!sandboxEnv()) return { available: false, items: [] };
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("activities")
    .select(
      "id, slug, kind, title, summary, status, starts_at, price, capacity, allow_late_join, gathering_details(format, area), clubs(name), creator:profiles!activities_created_by_fkey(nickname)",
    )
    .is("series_id", null)
    .in("status", ["open", "in_progress"])
    .order("starts_at");
  const rows = (data ?? []).filter((a) => a.status === "open" || a.allow_late_join);
  const { data: seats } = rows.length
    ? await supabase.rpc("activity_seat_counts", { p_ids: rows.map((a) => a.id) })
    : { data: [] };
  const taken = new Map((seats ?? []).map((s) => [s.activity_id, s.taken]));
  return {
    available: true,
    items: rows.map((a) => ({
      id: a.id,
      slug: a.slug,
      kind: a.kind as ActivityKind,
      title: a.title,
      summary: a.summary,
      status: a.status,
      startsAt: a.starts_at,
      area: a.gathering_details?.area ?? null,
      online: a.gathering_details?.format === "online",
      price: a.price,
      capacity: a.capacity,
      taken: taken.get(a.id) ?? 0,
      host: a.clubs?.name ?? a.creator?.nickname ?? "",
      lateJoin: a.allow_late_join,
    })),
  };
}

export type ClubCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  joinMode: "open" | "approval";
  members: number;
};

/** 공개 클럽 목록. */
export async function listClubs(): Promise<Result<ClubCardData>> {
  if (!sandboxEnv()) return { available: false, items: [] };
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("clubs")
    .select("id, slug, name, tagline, join_mode, club_members(count)")
    .eq("club_members.status", "active")
    .order("created_at");
  return {
    available: true,
    items: (data ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      joinMode: c.join_mode as "open" | "approval",
      members: c.club_members[0]?.count ?? 0,
    })),
  };
}
