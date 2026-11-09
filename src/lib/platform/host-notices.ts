import { errorCodeFrom } from "./messages";
import { createSessionClient } from "./supabase-server";

// 참가자 공지(H10). 누가 보는지는 RLS가 정한다: 관리하는 사람은 전부, 받은 사람은 자기 공지만(내린 것 빼고).

export type NoticeAudience = "confirmed" | "waitlisted" | "pending_payment";

export const AUDIENCE_LABELS: Record<NoticeAudience, string> = {
  confirmed: "확정",
  waitlisted: "대기",
  pending_payment: "입금 대기",
};

export type SentNotice = {
  id: string;
  title: string | null;
  body: string;
  audience: NoticeAudience[];
  createdAt: string;
  withdrawn: boolean;
  recipients: number;
  read: number;
};

export type MyNotice = {
  id: string;
  title: string | null;
  body: string;
  createdAt: string;
  unread: boolean;
};

const AUDIENCES: NoticeAudience[] = ["confirmed", "waitlisted", "pending_payment"];
const asAudience = (v: string[] | null) =>
  (v ?? []).filter((a): a is NoticeAudience => (AUDIENCES as string[]).includes(a));

/** 관리 화면: 보낸 공지 전부(최근 순), 받은 사람 · 읽은 사람 수와 함께. */
export async function listSentNotices(activityId: string): Promise<SentNotice[]> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("activity_notices")
    .select(
      "id, title, body, audience, created_at, withdrawn_at, activity_notice_recipients(read_at)",
    )
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    audience: asAudience(n.audience),
    createdAt: n.created_at,
    withdrawn: n.withdrawn_at !== null,
    recipients: n.activity_notice_recipients.length,
    read: n.activity_notice_recipients.filter((r) => r.read_at !== null).length,
  }));
}

/** 참가자 화면: 나에게 온 공지(최근 순)와 아직 안 읽었는지. */
export async function listMyNotices(activityId: string, userId: string): Promise<MyNotice[]> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("activity_notices")
    .select("id, title, body, created_at, activity_notice_recipients(user_id, read_at)")
    .eq("activity_id", activityId)
    .is("withdrawn_at", null)
    .order("created_at", { ascending: false });
  return (data ?? [])
    .map((n) => {
      const mine = n.activity_notice_recipients.find((r) => r.user_id === userId);
      return mine
        ? {
            id: n.id,
            title: n.title,
            body: n.body,
            createdAt: n.created_at,
            unread: mine.read_at === null,
          }
        : null;
    })
    .filter((n): n is MyNotice => n !== null);
}

export async function postNotice(
  activityId: string,
  audience: NoticeAudience[],
  body: string,
  title: string,
): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("notice_post", {
    p_activity: activityId,
    p_audience: audience,
    p_body: body,
    p_title: title,
  });
  return error ? errorCodeFrom(error.message) : null;
}

export async function withdrawNotice(id: string): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("notice_withdraw", { p_id: id });
  return error ? errorCodeFrom(error.message) : null;
}

export async function markNoticesRead(activityId: string): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.rpc("notice_mark_read", { p_activity: activityId });
}
