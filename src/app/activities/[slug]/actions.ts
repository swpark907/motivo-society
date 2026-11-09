"use server";

import { redirect } from "next/navigation";
import { submitCertification } from "@/lib/platform/challenge-room";
import { errorMessage } from "@/lib/platform/messages";

export type CertFormState = { error: string | null };

/** 오늘 인증을 올리거나 고친다. 성공하면 같은 화면의 참여 영역으로 돌아간다. */
export async function submitCert(_prev: CertFormState, formData: FormData): Promise<CertFormState> {
  const slug = String(formData.get("slug") ?? "");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("invalid slug");
  const text = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const body = text("body");
  const link = text("link");
  if (body && body.length > 1000) return { error: "인증 글은 1,000자까지 적을 수 있어요." };
  const code = await submitCertification(String(formData.get("activityId")), body, link);
  if (code) return { error: errorMessage(code) };
  redirect(`/activities/${slug}?notice=cert_submitted#today`);
}
