"use server";

import { redirect } from "next/navigation";
import { errorCodeFrom } from "@/lib/platform/messages";
import { isPersonaHandle, personaEmail, SANDBOX_PASSWORD } from "@/lib/platform/personas";
import { createServiceClient, createSessionClient } from "@/lib/platform/supabase-server";

function devOnly() {
  if (process.env.NODE_ENV !== "development") throw new Error("sandbox is development-only");
}

function backTo(formData: FormData, query: Record<string, string>): never {
  const raw = String(formData.get("returnTo") ?? "");
  const path = raw.startsWith("/demo/platform") ? raw.split("?")[0] : "/demo/platform";
  redirect(`${path}?${new URLSearchParams(query).toString()}`);
}

async function signInAs(handle: string) {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  if (handle === "anon") return;
  if (!isPersonaHandle(handle)) throw new Error("unknown persona");
  const { error } = await supabase.auth.signInWithPassword({
    email: personaEmail(handle),
    password: SANDBOX_PASSWORD,
  });
  if (error) throw error;
}

export async function switchPersona(formData: FormData) {
  devOnly();
  await signInAs(String(formData.get("handle") ?? "anon"));
  backTo(formData, { notice: "switched" });
}

export async function reseedSandbox(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  const handle = data.user?.email?.split("@")[0] ?? "anon";
  const { error } = await createServiceClient().rpc("sandbox_reseed");
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  // 초기화하면 가짜 계정을 다시 만들므로 세션이 끊긴다. 같은 사람으로 다시 들어간다.
  await signInAs(handle);
  backTo(formData, { notice: "reseeded" });
}

export async function applyToActivity(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("participation_apply", {
    p_activity: String(formData.get("activityId")),
    p_depositor: String(formData.get("depositor") ?? ""),
  });
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  backTo(formData, { notice: String(data) });
}

export async function cancelParticipation(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("participation_cancel", {
    p_activity: String(formData.get("activityId")),
  });
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  backTo(formData, { notice: "cancelled" });
}

export async function decideParticipation(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("participation_decide", {
    p_participation: String(formData.get("participationId")),
    p_approve: formData.get("approve") === "true",
  });
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  backTo(formData, { notice: "decided" });
}

export async function markAttendance(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("attendance_mark", {
    p_activity: String(formData.get("activityId")),
    p_user: String(formData.get("userId")),
    p_status: String(formData.get("status")),
  });
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  backTo(formData, { notice: "marked" });
}

/** 서버 액션 공통: DB 함수 하나를 부르고, 결과를 알림 코드로 돌려보낸다. */
async function runRpc(formData: FormData, notice: string, call: RpcCall) {
  devOnly();
  const supabase = await createSessionClient();
  const { error } = await call(supabase);
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  backTo(formData, { notice });
}

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;
type RpcCall = (supabase: SessionClient) => PromiseLike<{ error: { message: string } | null }>;

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function confirmPayment(formData: FormData) {
  await runRpc(formData, "paid", (s) =>
    s.rpc("order_confirm_payment", { p_order: field(formData, "orderId") }),
  );
}

export async function expireOverdueOrders(formData: FormData) {
  await runRpc(formData, "expired", (s) => s.rpc("orders_expire_overdue"));
}

export async function requestRefund(formData: FormData) {
  await runRpc(formData, "refund_requested", (s) =>
    s.rpc("refund_request", {
      p_order: field(formData, "orderId"),
      p_reason: field(formData, "reason"),
    }),
  );
}

export async function decideRefund(formData: FormData) {
  await runRpc(formData, "refund_decided", (s) =>
    s.rpc("refund_decide", {
      p_refund: field(formData, "refundId"),
      p_approve: field(formData, "approve") === "true",
    }),
  );
}

export async function markRefundPaid(formData: FormData) {
  await runRpc(formData, "refund_paid", (s) =>
    s.rpc("refund_mark_paid", { p_refund: field(formData, "refundId") }),
  );
}

export async function createSettlement(formData: FormData) {
  await runRpc(formData, "settlement_created", (s) =>
    s.rpc("settlement_create", {
      p_payee: field(formData, "payeeId"),
      p_start: field(formData, "start"),
      p_end: field(formData, "end"),
    }),
  );
}

export async function markSettlementPaid(formData: FormData) {
  await runRpc(formData, "settlement_paid", (s) =>
    s.rpc("settlement_mark_paid", { p_settlement: field(formData, "settlementId") }),
  );
}

export async function submitCertification(formData: FormData) {
  await runRpc(formData, "cert_submitted", (s) =>
    s.rpc("certification_submit", {
      p_activity: field(formData, "activityId"),
      p_body: field(formData, "body"),
      p_link: field(formData, "link"),
    }),
  );
}

export async function rejectCertification(formData: FormData) {
  await runRpc(formData, "cert_rejected", (s) =>
    s.rpc("certification_reject", {
      p_cert: field(formData, "certId"),
      p_reason: field(formData, "reason"),
    }),
  );
}

export async function finalizeChallenge(formData: FormData) {
  await runRpc(formData, "finalized", (s) =>
    s.rpc("challenge_finalize", { p_activity: field(formData, "activityId") }),
  );
}

export async function createClub(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const slug = field(formData, "slug").trim();
  const { error } = await supabase.rpc("club_create", {
    p_slug: slug,
    p_name: field(formData, "name"),
    p_tagline: field(formData, "tagline"),
    p_join_mode: field(formData, "joinMode") === "approval" ? "approval" : "open",
  });
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  redirect(`/demo/platform/clubs/${slug}?notice=club_created`);
}

export async function joinClub(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("club_join", { p_club: field(formData, "clubId") });
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  backTo(formData, { notice: String(data) });
}

export async function joinClubByInvite(formData: FormData) {
  await runRpc(formData, "invite_joined", (s) =>
    s.rpc("club_join_by_invite", { p_code: field(formData, "code").trim() }),
  );
}

export async function leaveClub(formData: FormData) {
  await runRpc(formData, "club_left", (s) =>
    s.rpc("club_leave", { p_club: field(formData, "clubId") }),
  );
}

export async function decideClubMember(formData: FormData) {
  await runRpc(formData, "member_decided", (s) =>
    s.rpc("club_member_decide", {
      p_club: field(formData, "clubId"),
      p_user: field(formData, "userId"),
      p_approve: field(formData, "approve") === "true",
    }),
  );
}

export async function assignClubLayer(formData: FormData) {
  await runRpc(formData, "layer_assigned", (s) =>
    s.rpc("club_assign_layer", {
      p_club: field(formData, "clubId"),
      p_user: field(formData, "userId"),
      p_layer: field(formData, "layerId"),
    }),
  );
}

export async function banClubMember(formData: FormData) {
  await runRpc(formData, "member_banned", (s) =>
    s.rpc("club_ban", { p_club: field(formData, "clubId"), p_user: field(formData, "userId") }),
  );
}

export async function saveClubLayer(formData: FormData) {
  const layerId = field(formData, "layerId");
  const rank = Number(field(formData, "rank"));
  await runRpc(formData, "layer_saved", (s) =>
    s.rpc("club_layer_save", {
      p_club: field(formData, "clubId"),
      // 새 레이어는 id 없이 보낸다. 생성된 타입이 nullable을 표현하지 못해 단언한다.
      p_layer: (layerId || null) as string,
      p_name: field(formData, "name"),
      p_rank: Number.isFinite(rank) ? rank : 0,
      p_permissions: formData.getAll("permissions").map(String),
    }),
  );
}

export async function deleteClubLayer(formData: FormData) {
  await runRpc(formData, "layer_deleted", (s) =>
    s.rpc("club_layer_delete", {
      p_club: field(formData, "clubId"),
      p_layer: field(formData, "layerId"),
    }),
  );
}

export async function createClubInvite(formData: FormData) {
  await runRpc(formData, "invite_created", (s) =>
    s.rpc("club_invite_create", { p_club: field(formData, "clubId"), p_max_uses: 5 }),
  );
}

/** datetime-local 값(시간대 없음)을 한국 시간으로 읽는다. */
function kst(value: string): string {
  return value ? `${value}:00+09:00` : "";
}

export async function createActivity(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const [organizer, clubId = ""] = field(formData, "organizer").split(":");
  const payload = {
    kind: field(formData, "kind"),
    organizer,
    club_id: clubId,
    title: field(formData, "title"),
    summary: field(formData, "summary"),
    price: field(formData, "price"),
    capacity: field(formData, "capacity"),
    payee_user_id: field(formData, "payee"),
    audience: field(formData, "audience"),
    required_activity_id: field(formData, "requiredActivity"),
    join_mode: field(formData, "joinMode"),
    allow_late_join: formData.get("allowLateJoin") === "on",
    format: field(formData, "format"),
    place_name: field(formData, "placeName"),
    area: field(formData, "area"),
    video_url: field(formData, "videoUrl"),
    address_detail: field(formData, "addressDetail"),
    starts_at: kst(field(formData, "startsAt")),
    ends_at: kst(field(formData, "endsAt")),
    first_starts_at: kst(field(formData, "firstStartsAt")),
    session_count: field(formData, "sessionCount"),
    interval_days: field(formData, "intervalDays"),
    duration_minutes: field(formData, "durationMinutes"),
    starts_on: field(formData, "startsOn"),
    ends_on: field(formData, "endsOn"),
    cert_rule: field(formData, "certRule"),
    cert_n: field(formData, "certN"),
    cert_formats: formData.getAll("certFormats").map(String),
    completion_threshold: field(formData, "threshold"),
    mission: field(formData, "mission"),
  };
  const { data, error } = await supabase.rpc("activity_create", { p: payload });
  if (error) backTo(formData, { kind: payload.kind, error: errorCodeFrom(error.message) });
  redirect(`/demo/platform/activities/${data}?notice=activity_created`);
}

export async function publishActivity(formData: FormData) {
  devOnly();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("activity_publish", {
    p_activity: field(formData, "activityId"),
  });
  if (error) backTo(formData, { error: errorCodeFrom(error.message) });
  backTo(formData, { notice: data === "in_progress" ? "published_running" : "published" });
}
