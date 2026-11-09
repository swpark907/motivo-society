import type { MyParticipation } from "./apply-state";
import type { ActivityKind } from "./explore-filters";
import { createSessionClient, sandboxEnv } from "./supabase-server";
import { coverSrc } from "./media";

// 활동 상세 한 화면에 필요한 것을 한 번에 읽는다. 사용자 세션으로 읽으므로
// 볼 수 없는 활동(초안·멤버 공개)은 없는 것처럼 null이 된다.

export type Session = {
  no: number;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  online: boolean;
  area: string | null;
};

export type ActivityDetail = {
  id: string;
  slug: string;
  kind: ActivityKind;
  title: string;
  summary: string | null;
  description: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  cover: string | null;
  price: number;
  capacity: number | null;
  taken: number;
  joinMode: "instant" | "approval";
  audience: "anyone" | "club_members" | "entitlement_holders";
  applyOpensAt: string | null;
  applyClosesAt: string | null;
  allowLateJoin: boolean;
  organizer: { kind: string; name: string; tagline: string | null; clubSlug: string | null };
  facilitators: { nickname: string; bio: string | null }[];
  place: { online: boolean; name: string | null; area: string | null; hideAddress: boolean } | null;
  sessions: Session[];
  challenge: {
    startsOn: string;
    endsOn: string;
    rule: "daily" | "weekly_n" | "total_n";
    n: number | null;
    formats: string[];
    threshold: number;
  } | null;
  requiredActivity: { slug: string; title: string } | null;
  refundRules: { days_before: number; rate: number }[] | null;
  viewer: {
    signedIn: boolean;
    isManager: boolean;
    mine: MyParticipation;
    isClubMember: boolean | null;
    hasEntitlement: boolean | null;
    privateInfo: {
      addressDetail: string | null;
      videoUrl: string | null;
      videoOpensAt: string | null;
    } | null;
  };
};

/** 회차 slug로 들어오면 소속 시즌 slug를 돌려준다(상세는 시즌 화면에서 본다). */
export type DetailResult =
  { found: true; activity: ActivityDetail } | { found: false; seriesSlug?: string };

export async function getActivityDetail(slug: string): Promise<DetailResult> {
  if (!sandboxEnv()) return { found: false };
  const supabase = await createSessionClient();
  const { data: a } = await supabase
    .from("activities")
    .select(
      "id, slug, kind, title, summary, description, status, starts_at, ends_at, cover_path, price, capacity, join_mode, audience, apply_opens_at, apply_closes_at, allow_late_join, organizer_kind, series_id, required_activity_id, club_id, created_by, gathering_details(format, place_name, area, hide_address_until_confirmed), clubs(slug, name, tagline), creator:profiles!activities_created_by_fkey(nickname, bio)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!a) return { found: false };
  if (a.series_id) {
    const { data: parent } = await supabase
      .from("activities")
      .select("slug")
      .eq("id", a.series_id)
      .maybeSingle();
    return { found: false, seriesSlug: parent?.slug };
  }

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;

  const [
    seats,
    hosts,
    sessions,
    challenge,
    required,
    policy,
    mine,
    manager,
    member,
    entitled,
    priv,
  ] = await Promise.all([
    supabase.rpc("activity_seat_counts", { p_ids: [a.id] }),
    supabase.from("activity_hosts").select("profiles(nickname, bio)").eq("activity_id", a.id),
    a.kind === "series"
      ? supabase
          .from("activities")
          .select("session_no, title, starts_at, ends_at, status, gathering_details(format, area)")
          .eq("series_id", a.id)
          .order("session_no")
      : Promise.resolve({ data: null }),
    a.kind === "challenge"
      ? supabase
          .from("challenge_details")
          .select("starts_on, ends_on, cert_rule, cert_n, cert_formats, completion_threshold")
          .eq("activity_id", a.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    a.required_activity_id
      ? supabase
          .from("activities")
          .select("slug, title")
          .eq("id", a.required_activity_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    a.price > 0
      ? supabase
          .from("refund_policies")
          .select("rules")
          .eq("target_kind", a.kind)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    uid
      ? supabase
          .from("participations")
          .select("status")
          .eq("activity_id", a.id)
          .eq("user_id", uid)
          .neq("status", "cancelled")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    uid
      ? supabase.rpc("can_manage_activity", { p_activity: a.id })
      : Promise.resolve({ data: false }),
    uid && a.audience === "club_members" && a.club_id
      ? supabase.rpc("is_club_member", { p_club: a.club_id })
      : Promise.resolve({ data: null }),
    uid && a.audience === "entitlement_holders" && a.required_activity_id
      ? supabase.rpc("has_entitlement", { p_user: uid, p_activity: a.required_activity_id })
      : Promise.resolve({ data: null }),
    uid
      ? supabase.rpc("get_activity_private", { p_activity: a.id })
      : Promise.resolve({ data: null }),
  ]);

  const privJson = priv.data as {
    access?: string;
    address_detail?: string | null;
    video_url?: string | null;
    video_opens_at?: string | null;
  } | null;
  const details = a.gathering_details;
  const firstSession = sessions.data?.[0]?.gathering_details;
  const placeSource = details ?? firstSession ?? null;

  return {
    found: true,
    activity: {
      id: a.id,
      slug: a.slug,
      kind: a.kind as ActivityKind,
      title: a.title,
      summary: a.summary,
      description: a.description,
      status: a.status,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      cover: coverSrc(a.cover_path),
      price: a.price,
      capacity: a.capacity,
      taken: seats.data?.[0]?.taken ?? 0,
      joinMode: a.join_mode as "instant" | "approval",
      audience: a.audience as ActivityDetail["audience"],
      applyOpensAt: a.apply_opens_at,
      applyClosesAt: a.apply_closes_at,
      allowLateJoin: a.allow_late_join,
      organizer: {
        kind: a.organizer_kind,
        name: a.clubs?.name ?? a.creator?.nickname ?? "모쏘",
        tagline: a.clubs?.tagline ?? a.creator?.bio ?? null,
        clubSlug: a.clubs?.slug ?? null,
      },
      facilitators: (hosts.data ?? [])
        .map((h) => h.profiles)
        .filter((p): p is { nickname: string; bio: string | null } => Boolean(p)),
      place:
        a.kind === "challenge"
          ? { online: true, name: "온라인 인증", area: null, hideAddress: false }
          : placeSource
            ? {
                online: placeSource.format === "online",
                name: details?.place_name ?? null,
                area: placeSource.area ?? null,
                hideAddress: details?.hide_address_until_confirmed ?? true,
              }
            : null,
      sessions: (sessions.data ?? []).map((x) => ({
        no: x.session_no ?? 0,
        title: x.title,
        startsAt: x.starts_at,
        endsAt: x.ends_at,
        status: x.status,
        online: x.gathering_details?.format === "online",
        area: x.gathering_details?.area ?? null,
      })),
      challenge: challenge.data
        ? {
            startsOn: challenge.data.starts_on,
            endsOn: challenge.data.ends_on,
            rule: challenge.data.cert_rule as "daily" | "weekly_n" | "total_n",
            n: challenge.data.cert_n,
            formats: challenge.data.cert_formats,
            threshold: challenge.data.completion_threshold,
          }
        : null,
      requiredActivity: required.data ?? null,
      refundRules:
        (policy.data?.rules as { days_before: number; rate: number }[] | undefined) ?? null,
      viewer: {
        signedIn: Boolean(uid),
        isManager: Boolean(manager.data),
        mine: (mine.data?.status as MyParticipation) ?? null,
        isClubMember: member.data,
        hasEntitlement: entitled.data,
        privateInfo:
          privJson && privJson.access && privJson.access !== "none"
            ? {
                addressDetail: privJson.address_detail ?? null,
                videoUrl: privJson.video_url ?? null,
                videoOpensAt: privJson.video_opens_at ?? null,
              }
            : null,
      },
    },
  };
}
