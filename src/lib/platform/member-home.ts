import { kstDayStart } from "./activity-time";
import type { ActivityKind } from "./explore-filters";
import { listOpenActivities, type ActivityCardData } from "./queries";
import { createSessionClient } from "./supabase-server";
import { coverSrc } from "./media";

// 회원 홈 한 화면의 데이터: 오늘 → 내 사람들 → 발견.
// 대시보드 숫자가 아니라 "지금 할 것"과 "내 사람들의 소식"을 고른다.

export type Upcoming = {
  slug: string; // 회차면 소속 시즌의 slug
  kind: ActivityKind;
  title: string;
  startsAt: string;
  endsAt: string | null;
  place: string | null;
  online: boolean;
  cover: string | null;
};

export type Todo =
  | { kind: "payment"; slug: string; title: string; amount: number; dueAt: string }
  | {
      kind: "cert";
      slug: string;
      title: string;
      accepted: number;
      threshold: number;
    }
  | { kind: "waiting"; slug: string; title: string; status: "waitlisted" | "pending_approval" }
  | { kind: "club_pending"; slug: string; title: string };

export type MyClub = {
  slug: string;
  name: string;
  tagline: string | null;
  members: string[]; // 닉네임(얼굴용, 최대 5)
  memberCount: number;
  openActivities: number;
};

export type FeedItem = {
  id: string;
  nickname: string;
  activityTitle: string;
  slug: string;
  body: string | null;
  certDate: string;
};

export type MemberHome = {
  upcoming: Upcoming[];
  todos: Todo[];
  clubs: MyClub[];
  feed: FeedItem[];
  discover: ActivityCardData[];
  isNewcomer: boolean;
};

const KST_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });

export async function getMemberHome(userId: string, now = new Date()): Promise<MemberHome> {
  const supabase = await createSessionClient();
  const today = KST_DATE.format(now);

  const { data: parts } = await supabase
    .from("participations")
    .select(
      "status, activity:activities(id, slug, kind, title, starts_at, ends_at, status, cover_path, gathering_details(format, place_name, area))",
    )
    .eq("user_id", userId)
    .neq("status", "cancelled");
  const mine = (parts ?? []).filter((p) => p.activity);
  const confirmed = mine.filter((p) => p.status === "confirmed");
  const seriesById = new Map(
    confirmed
      .filter((p) => p.activity!.kind === "series")
      .map((p) => [p.activity!.id, p.activity!]),
  );
  const liveChallenges = confirmed
    .filter((p) => p.activity!.kind === "challenge" && p.activity!.status === "in_progress")
    .map((p) => p.activity!);

  const [sessions, certsToday, orders, clubRows, progress] = await Promise.all([
    seriesById.size
      ? supabase
          .from("activities")
          .select("series_id, starts_at, ends_at, gathering_details(format, place_name, area)")
          .in("series_id", [...seriesById.keys()])
          .neq("status", "cancelled")
      : Promise.resolve({ data: [] }),
    liveChallenges.length
      ? supabase
          .from("certifications")
          .select("activity_id")
          .eq("user_id", userId)
          .eq("cert_date", today)
      : Promise.resolve({ data: [] as { activity_id: string }[] }),
    supabase
      .from("orders")
      .select("amount, due_at, activity:activities(slug, title)")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("due_at"),
    supabase
      .from("club_members")
      .select("status, club:clubs(id, slug, name, tagline)")
      .eq("user_id", userId)
      .in("status", ["active", "pending"]),
    Promise.all(
      liveChallenges.map(async (c) => {
        const [{ data: rows }, { data: detail }] = await Promise.all([
          supabase.rpc("challenge_progress", { p_activity: c.id }),
          supabase
            .from("challenge_details")
            .select("completion_threshold")
            .eq("activity_id", c.id)
            .maybeSingle(),
        ]);
        const me = (rows ?? []).find((r) => r.user_id === userId);
        return {
          id: c.id,
          accepted: me?.accepted ?? 0,
          threshold: detail?.completion_threshold ?? 0,
        };
      }),
    ),
  ]);

  // ── 오늘: 다가오는 일정(모임과 시즌 회차)
  const upcoming: Upcoming[] = [];
  const nowIso = now.toISOString();
  const place = (g: { format: string; place_name: string | null; area: string | null } | null) => ({
    online: g?.format === "online",
    place: g ? (g.format === "online" ? "온라인" : (g.place_name ?? g.area)) : null,
  });
  for (const p of confirmed) {
    const a = p.activity!;
    if (a.kind !== "gathering" || !a.starts_at || (a.ends_at ?? a.starts_at) < nowIso) continue;
    upcoming.push({
      slug: a.slug,
      kind: "gathering",
      title: a.title,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      cover: coverSrc(a.cover_path),
      ...place(a.gathering_details),
    });
  }
  for (const s of sessions.data ?? []) {
    const series = s.series_id ? seriesById.get(s.series_id) : null;
    if (!series || !s.starts_at || (s.ends_at ?? s.starts_at) < nowIso) continue;
    upcoming.push({
      slug: series.slug,
      kind: "series",
      title: series.title,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      cover: coverSrc(series.cover_path),
      ...place(s.gathering_details),
    });
  }
  upcoming.sort((x, y) => x.startsAt.localeCompare(y.startsAt));

  // ── 오늘 할 일: 입금 · 오늘 인증 · 기다리는 신청
  const certified = new Set((certsToday.data ?? []).map((c) => c.activity_id));
  const progressById = new Map(progress.map((x) => [x.id, x]));
  const todos: Todo[] = [
    ...(orders.data ?? [])
      .filter((o) => o.activity)
      .map((o) => ({
        kind: "payment" as const,
        slug: o.activity!.slug,
        title: o.activity!.title,
        amount: o.amount,
        dueAt: o.due_at,
      })),
    ...liveChallenges
      .filter((c) => !certified.has(c.id))
      .map((c) => ({
        kind: "cert" as const,
        slug: c.slug,
        title: c.title,
        accepted: progressById.get(c.id)?.accepted ?? 0,
        threshold: progressById.get(c.id)?.threshold ?? 0,
      })),
    ...mine
      .filter((p) => p.status === "waitlisted" || p.status === "pending_approval")
      .filter((p) => !["ended", "cancelled"].includes(p.activity!.status))
      .map((p) => ({
        kind: "waiting" as const,
        slug: p.activity!.slug,
        title: p.activity!.title,
        status: p.status as "waitlisted" | "pending_approval",
      })),
    ...(clubRows.data ?? [])
      .filter((m) => m.status === "pending" && m.club)
      .map((m) => ({ kind: "club_pending" as const, slug: m.club!.slug, title: m.club!.name })),
  ];

  // ── 내 사람들: 내 클럽 + 같이 챌린지하는 사람들의 최근 인증
  const clubs = (clubRows.data ?? [])
    .filter((m) => m.status === "active")
    .map((m) => m.club)
    .filter((c) => c !== null);
  const clubIds = clubs.map((c) => c.id);
  const myChallengeIds = confirmed
    .filter((p) => p.activity!.kind === "challenge")
    .map((p) => p.activity!.id);
  const [members, clubActs, certs] = await Promise.all([
    clubIds.length
      ? supabase
          .from("club_members")
          .select("club_id, profile:profiles!club_members_user_id_fkey(nickname)")
          .in("club_id", clubIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] }),
    clubIds.length
      ? supabase
          .from("activities")
          .select("club_id")
          .in("club_id", clubIds)
          .is("series_id", null)
          .in("status", ["open", "in_progress"])
      : Promise.resolve({ data: [] }),
    myChallengeIds.length
      ? supabase
          .from("certifications")
          .select(
            "id, cert_date, body, user_id, activity:activities(slug, title), author:profiles!certifications_user_id_fkey(nickname)",
          )
          .in("activity_id", myChallengeIds)
          .eq("status", "accepted")
          .neq("user_id", userId)
          .order("cert_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] }),
  ]);

  // 한 사람이 소식을 다 채우지 않게 사람마다 최신 하나.
  const seen = new Set<string>();
  const feed: FeedItem[] = [];
  for (const c of certs.data ?? []) {
    if (seen.has(c.user_id) || !c.activity) continue;
    seen.add(c.user_id);
    feed.push({
      id: c.id,
      nickname: c.author?.nickname ?? "참가자",
      activityTitle: c.activity.title,
      slug: c.activity.slug,
      body: c.body,
      certDate: c.cert_date,
    });
    if (feed.length >= 4) break;
  }

  const myClubs: MyClub[] = clubs.map((c) => {
    const names = (members.data ?? [])
      .filter((m) => m.club_id === c.id)
      .map((m) => m.profile?.nickname)
      .filter((n): n is string => Boolean(n));
    return {
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      members: names.slice(0, 5),
      memberCount: names.length,
      openActivities: (clubActs.data ?? []).filter((a) => a.club_id === c.id).length,
    };
  });

  // ── 발견: 내가 신청하지 않은 모집 중 활동, 가까운 날짜순
  const joined = new Set(mine.map((p) => p.activity!.id));
  const { items } = await listOpenActivities(now);
  const discover = items.filter((a) => !joined.has(a.id)).slice(0, 8);

  const isNewcomer =
    upcoming.length === 0 && todos.length === 0 && myClubs.length === 0 && feed.length === 0;
  return { upcoming, todos, clubs: myClubs, feed, discover, isNewcomer };
}

/** 인사말(한국 시간 기준). */
export function greeting(now: Date): string {
  const hour = Math.floor((now.getTime() - kstDayStart(now).getTime()) / 3_600_000);
  if (hour < 6) return "늦은 밤이에요";
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후예요";
  return "좋은 저녁이에요";
}
