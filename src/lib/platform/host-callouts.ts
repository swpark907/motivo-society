import { errorCodeFrom } from "./messages";
import { createSessionClient } from "./supabase-server";

// 지난 참가자 다시 부르기와 단골(H11). 누구에게 가는지 · 누가 빠지는지는 DB 함수(callout_send)가 정한다.

export type Regular = {
  userId: string;
  nickname: string;
  times: number;
  lastAt: string | null;
  attended: number;
  absent: number;
};

export type ReceivedCallout = {
  id: string;
  message: string | null;
  createdAt: string;
  read: boolean;
  hostId: string;
  host: string;
  activity: { slug: string; title: string; kind: string; startsAt: string | null; status: string };
};

export type SentCallout = {
  createdAt: string;
  message: string | null;
  recipients: number;
  read: number;
};

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function getRegulars(): Promise<Regular[]> {
  const supabase = await createSessionClient();
  const { data } = await supabase.rpc("host_regulars");
  return ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).map((r) => ({
    userId: str(r.user_id),
    nickname: str(r.nickname),
    times: num(r.times),
    lastAt: typeof r.last_at === "string" ? r.last_at : null,
    attended: num(r.attended),
    absent: num(r.absent),
  }));
}

export async function listReceivedCallouts(): Promise<ReceivedCallout[]> {
  const supabase = await createSessionClient();
  const { data } = await supabase.rpc("my_callouts");
  return ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).map((c) => {
    const a = (c.activity ?? {}) as Record<string, unknown>;
    return {
      id: str(c.id),
      message: typeof c.message === "string" ? c.message : null,
      createdAt: str(c.created_at),
      read: c.read === true,
      hostId: str(c.host_id),
      host: str(c.host),
      activity: {
        slug: str(a.slug),
        title: str(a.title),
        kind: str(a.kind),
        startsAt: typeof a.starts_at === "string" ? a.starts_at : null,
        status: str(a.status),
      },
    };
  });
}

/** 이 활동에서 보낸 다시 부르기(없으면 null). 활동마다 한 번만 보낸다. */
export async function getSentCallout(activityId: string): Promise<SentCallout | null> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("activity_callouts")
    .select("created_at, message, activity_callout_recipients(read_at)")
    .eq("activity_id", activityId)
    .maybeSingle();
  if (!data) return null;
  return {
    createdAt: data.created_at,
    message: data.message,
    recipients: data.activity_callout_recipients.length,
    read: data.activity_callout_recipients.filter((r) => r.read_at !== null).length,
  };
}

export async function sendCallout(
  activityId: string,
  sources: string[],
  message: string,
): Promise<{ count: number } | { error: string }> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("callout_send", {
    p_activity: activityId,
    p_sources: sources,
    p_message: message,
  });
  return error ? { error: errorCodeFrom(error.message) } : { count: num(data) };
}

/** MY 화면의 받은 소식 설정: 전체 받기 여부와 끈 호스트 목록. */
export async function getCalloutSettings(
  userId: string,
): Promise<{ accept: boolean; muted: { id: string; nickname: string }[] }> {
  const supabase = await createSessionClient();
  const [{ data: me }, { data: muted }] = await Promise.all([
    supabase.from("profiles").select("accept_host_callouts").eq("id", userId).maybeSingle(),
    supabase
      .from("callout_mutes")
      .select("host_user_id, host:profiles!callout_mutes_host_user_id_fkey(nickname)")
      .order("created_at", { ascending: false }),
  ]);
  return {
    accept: me?.accept_host_callouts ?? true,
    muted: (muted ?? []).map((m) => ({ id: m.host_user_id, nickname: m.host?.nickname ?? "" })),
  };
}

export async function setCalloutAccept(accept: boolean): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("callout_settings_set", { p_accept: accept });
  return error ? errorCodeFrom(error.message) : null;
}

export async function muteHost(hostId: string, mute: boolean): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("callout_mute_host", { p_host: hostId, p_mute: mute });
  return error ? errorCodeFrom(error.message) : null;
}

export async function markCalloutsRead(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase.rpc("callout_mark_read");
}
