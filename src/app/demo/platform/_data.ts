import { createSessionClient } from "@/lib/platform/supabase-server";

export type Viewer = { id: string; handle: string; nickname: string } | null;

export async function getViewer(): Promise<Viewer> {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    handle: data.user.email?.split("@")[0] ?? "",
    nickname: profile?.nickname ?? "(프로필 없음)",
  };
}

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatWhen(iso: string | null): string {
  return iso ? dateFormat.format(new Date(iso)) : "일정 미정";
}
