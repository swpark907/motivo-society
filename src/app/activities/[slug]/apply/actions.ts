"use server";

import { redirect } from "next/navigation";
import { applyTo, cancelMine } from "@/lib/platform/apply";
import { errorMessage } from "@/lib/platform/messages";

export type ApplyFormState = { error: string | null };

function slugOf(formData: FormData): string {
  const slug = String(formData.get("slug") ?? "");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("invalid slug");
  return slug;
}

export async function submitApplication(
  _prev: ApplyFormState,
  formData: FormData,
): Promise<ApplyFormState> {
  const slug = slugOf(formData);
  const depositor = String(formData.get("depositor") ?? "").trim() || null;
  const result = await applyTo(String(formData.get("activityId")), depositor);
  if ("error" in result) return { error: errorMessage(result.error) };
  // 결과는 같은 주소에서 내 신청 내역으로 보여 준다.
  redirect(`/activities/${slug}/apply`);
}

export async function cancelApplication(formData: FormData) {
  const slug = slugOf(formData);
  const code = await cancelMine(String(formData.get("activityId")));
  if (code) redirect(`/activities/${slug}/apply?error=${code}`);
  redirect(`/activities/${slug}?notice=cancelled`);
}
