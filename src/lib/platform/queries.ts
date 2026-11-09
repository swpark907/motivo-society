import type { ActivityKind } from "./explore-filters";
import { createSessionClient, sandboxEnv } from "./supabase-server";
import { coverSrc } from "./media";

// 플랫폼 화면의 데이터 읽기는 여기서만 한다(페이지가 쿼리를 직접 쓰지 않는다).
// 읽기는 사용자 세션으로 하므로 DB의 접근 규칙(RLS)이 그대로 적용된다.

export type { ActivityKind };

export type ActivityCardData = {
  id: string;
  slug: string;
  kind: ActivityKind;
  title: string;
  summary: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  /** 사이트 안 이미지 경로. 없으면 카드가 종류 색 기본 표지를 그린다. */
  cover: string | null;
  area: string | null;
  online: boolean;
  price: number;
  capacity: number | null;
  taken: number;
  host: string;
  lateJoin: boolean;
  /** 시즌만: 회차 수와 다음 회차 시작. */
  sessions: { count: number; nextAt: string | null } | null;
};

/** 로컬 Supabase 연결 정보가 없으면(예: CI) 화면이 깨지지 않게 빈 결과와 함께 알린다. */
export type Result<T> = { available: boolean; items: T[] };

/**
 * 발견에 보일 활동: 모집 중, 또는 진행 중이지만 중도 합류를 받는 것. 회차는 빼고 시즌으로 보인다.
 * 필터는 화면에서 `explore-filters`로 건다(지금 규모에서는 한 번 읽어 거르는 쪽이 단순하다).
 */
export async function listOpenActivities(now = new Date()): Promise<Result<ActivityCardData>> {
  if (!sandboxEnv()) return { available: false, items: [] };
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("activities")
    .select(
      "id, slug, kind, title, summary, status, starts_at, ends_at, cover_path, price, capacity, allow_late_join, gathering_details(format, area), clubs(name), creator:profiles!activities_created_by_fkey(nickname)",
    )
    .is("series_id", null)
    .in("status", ["open", "in_progress"])
    .order("starts_at");
  const rows = (data ?? []).filter((a) => a.status === "open" || a.allow_late_join);
  const ids = rows.map((a) => a.id);
  const seriesIds = rows.filter((a) => a.kind === "series").map((a) => a.id);

  const [{ data: seats }, { data: sessionRows }] = await Promise.all([
    ids.length
      ? supabase.rpc("activity_seat_counts", { p_ids: ids })
      : Promise.resolve({ data: [] }),
    seriesIds.length
      ? supabase
          .from("activities")
          .select("series_id, starts_at, gathering_details(format, area)")
          .in("series_id", seriesIds)
          .neq("status", "cancelled")
          .order("starts_at")
      : Promise.resolve({ data: [] }),
  ]);
  const taken = new Map((seats ?? []).map((s) => [s.activity_id, s.taken]));
  const sessionsBySeries = new Map<string, NonNullable<typeof sessionRows>>();
  for (const row of sessionRows ?? []) {
    if (!row.series_id) continue;
    sessionsBySeries.set(row.series_id, [...(sessionsBySeries.get(row.series_id) ?? []), row]);
  }

  return {
    available: true,
    items: rows.map((a) => {
      const sessions = sessionsBySeries.get(a.id) ?? [];
      const next = sessions.find((x) => x.starts_at && new Date(x.starts_at) >= now);
      // 시즌의 장소·형식은 다음(없으면 첫) 회차를 따른다. 챌린지는 온라인 인증이다.
      const place =
        a.gathering_details ?? next?.gathering_details ?? sessions[0]?.gathering_details;
      return {
        id: a.id,
        slug: a.slug,
        kind: a.kind as ActivityKind,
        title: a.title,
        summary: a.summary,
        status: a.status,
        startsAt: a.starts_at,
        endsAt: a.ends_at,
        cover: coverSrc(a.cover_path),
        area: place?.area ?? null,
        online: a.kind === "challenge" || place?.format === "online",
        price: a.price,
        capacity: a.capacity,
        taken: taken.get(a.id) ?? 0,
        host: a.clubs?.name ?? a.creator?.nickname ?? "",
        lateJoin: a.allow_late_join,
        sessions:
          a.kind === "series" ? { count: sessions.length, nextAt: next?.starts_at ?? null } : null,
      };
    }),
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
