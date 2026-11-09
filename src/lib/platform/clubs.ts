import type { MemberStatus } from "./club-state";
import { errorCodeFrom } from "./messages";
import { listClubs, listOpenActivities, type ActivityCardData, type ClubCardData } from "./queries";
import { createSessionClient, sandboxEnv } from "./supabase-server";

// 클럽 찾기·상세·가입·초대. 읽기는 사용자 세션(볼 수 없는 클럽은 없는 것처럼), 쓰기는 DB 함수만.

export type MyClubCard = ClubCardData & { myStatus: "active" | "pending" };

/** 클럽 목록과, 로그인했으면 내 클럽(가입 대기 포함). */
export async function listClubsFor(
  userId: string | null,
): Promise<{ available: boolean; mine: MyClubCard[]; all: ClubCardData[] }> {
  const { available, items } = await listClubs();
  if (!available || !userId) return { available, mine: [], all: items };
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("club_members")
    .select("club_id, status")
    .eq("user_id", userId)
    .in("status", ["active", "pending"]);
  const statusBy = new Map((data ?? []).map((m) => [m.club_id, m.status as "active" | "pending"]));
  const mine = items
    .filter((c) => statusBy.has(c.id))
    .map((c) => ({ ...c, myStatus: statusBy.get(c.id)! }));
  return { available, mine, all: items };
}

export type ClubPerson = { nickname: string; layer: string; kind: "admin" | "custom" | "member" };

export type ClubDetail = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  joinMode: "open" | "approval";
  members: ClubPerson[];
  activities: ActivityCardData[];
  me: { status: MemberStatus; layerName: string | null; canInvite: boolean } | null;
};

export async function getClubDetail(slug: string, now = new Date()): Promise<ClubDetail | null> {
  if (!sandboxEnv()) return null;
  const supabase = await createSessionClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id, slug, name, tagline, description, join_mode")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!club) return null;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;

  const [{ data: members }, { data: acts }, role, mine, open] = await Promise.all([
    supabase
      .from("club_members")
      .select(
        "joined_at, profile:profiles!club_members_user_id_fkey(nickname), layer:club_layers(name, rank, kind)",
      )
      .eq("club_id", club.id)
      .eq("status", "active"),
    supabase.from("activities").select("id").eq("club_id", club.id).is("series_id", null),
    uid ? supabase.rpc("club_my_role", { p_club: club.id }) : Promise.resolve({ data: null }),
    uid
      ? supabase
          .from("club_members")
          .select("status")
          .eq("club_id", club.id)
          .eq("user_id", uid)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    listOpenActivities(now),
  ]);

  // 운영진(레이어 순서)이 먼저, 그다음 멤버는 가입한 순.
  const people = (members ?? [])
    .filter((m) => m.profile && m.layer)
    .sort((x, y) => x.layer!.rank - y.layer!.rank || x.joined_at.localeCompare(y.joined_at))
    .map((m) => ({
      nickname: m.profile!.nickname,
      layer: m.layer!.name,
      kind: m.layer!.kind as ClubPerson["kind"],
    }));

  const ids = new Set((acts ?? []).map((a) => a.id));
  const roleJson = role.data as { layer_name?: string | null; permissions?: string[] } | null;
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    tagline: club.tagline,
    description: club.description,
    joinMode: club.join_mode as ClubDetail["joinMode"],
    members: people,
    activities: open.items.filter((a) => ids.has(a.id)),
    me: uid
      ? {
          status: (mine.data?.status as MemberStatus) ?? null,
          layerName: roleJson?.layer_name ?? null,
          canInvite: roleJson?.permissions?.includes("invite.create") ?? false,
        }
      : null,
  };
}

/** 가입(승인제면 신청). 결과 상태 또는 오류 코드. */
export async function joinClub(clubId: string): Promise<{ status: string } | { error: string }> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("club_join", { p_club: clubId });
  return error ? { error: errorCodeFrom(error.message) } : { status: String(data) };
}

export async function leaveClub(clubId: string): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("club_leave", { p_club: clubId });
  return error ? errorCodeFrom(error.message) : null;
}

/** 초대 코드를 만든다(7일, 횟수 제한 없음). */
export async function createInvite(clubId: string): Promise<{ code: string } | { error: string }> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("club_invite_create", { p_club: clubId });
  return error ? { error: errorCodeFrom(error.message) } : { code: String(data) };
}

/** 초대 코드로 본 클럽. valid가 false면 만료·취소·횟수 초과(클럽은 보여 준다). */
export type InvitePreview = {
  valid: boolean;
  slug: string;
  name: string;
  tagline: string | null;
  members: number;
};

export async function previewInvite(code: string): Promise<InvitePreview | null> {
  if (!sandboxEnv() || !/^[a-f0-9]{6,64}$/.test(code)) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.rpc("club_invite_preview", { p_code: code });
  const json = data as Partial<InvitePreview> | null;
  if (!json || !json.slug) return null;
  return json as InvitePreview;
}

/** 초대받은 클럽에서 내 상태(이미 멤버면 가입 버튼 대신 클럽으로 보낸다). */
export async function myClubStatusBySlug(slug: string, userId: string): Promise<MemberStatus> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("club_members")
    .select("status, club:clubs!inner(slug)")
    .eq("user_id", userId)
    .eq("club.slug", slug)
    .maybeSingle();
  return (data?.status as MemberStatus) ?? null;
}

/** 초대 코드로 가입한다(승인제여도 바로). 클럽 slug 또는 오류 코드. */
export async function joinByInvite(code: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("club_join_by_invite", { p_code: code });
  return error ? { error: errorCodeFrom(error.message) } : { ok: true };
}
