"use server";

import { redirect } from "next/navigation";
import { createInvite, joinByInvite, joinClub, leaveClub } from "@/lib/platform/clubs";
import { errorMessage } from "@/lib/platform/messages";

function slugOf(formData: FormData): string {
  const slug = String(formData.get("slug") ?? "");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("invalid slug");
  return slug;
}

/** 가입(승인제면 신청). 결과는 같은 클럽 화면의 알림으로. */
export async function joinAction(formData: FormData) {
  const slug = slugOf(formData);
  const result = await joinClub(String(formData.get("clubId")));
  if ("error" in result) redirect(`/clubs/${slug}?error=${result.error}`);
  redirect(`/clubs/${slug}?notice=${result.status === "pending" ? "pending" : "active"}`);
}

export async function leaveAction(formData: FormData) {
  const slug = slugOf(formData);
  const code = await leaveClub(String(formData.get("clubId")));
  if (code) redirect(`/clubs/${slug}?error=${code}`);
  redirect(`/clubs/${slug}?notice=club_left`);
}

export type InviteState = { code: string | null; error: string | null };

export async function inviteAction(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const result = await createInvite(String(formData.get("clubId")));
  return "error" in result
    ? { code: null, error: errorMessage(result.error) }
    : { code: result.code, error: null };
}

/** 초대 링크로 가입. 승인제 클럽이어도 바로 멤버가 된다. */
export async function acceptInviteAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  if (!/^[a-f0-9]{6,64}$/.test(code)) throw new Error("invalid code");
  const slug = slugOf(formData);
  const result = await joinByInvite(code);
  if ("error" in result) redirect(`/invite/${code}?error=${result.error}`);
  redirect(`/clubs/${slug}?notice=invite_joined`);
}
