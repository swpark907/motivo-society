"use server";

import { redirect } from "next/navigation";
import {
  decideHostParticipation,
  finalizeHostChallenge,
  markHostAttendance,
  publishHostActivity,
} from "@/lib/platform/host";

const UUID = /^[0-9a-f-]{36}$/;

function uuidOf(formData: FormData, name: string): string {
  const v = String(formData.get(name) ?? "");
  if (!UUID.test(v)) throw new Error(`invalid ${name}`);
  return v;
}

/** 결과는 같은 관리 화면의 알림으로. 명단에서 누른 동작은 명단 위치로 돌아간다. */
function back(id: string, q: { notice?: string; error?: string }, hash = ""): never {
  const key = q.error ? "error" : "notice";
  redirect(`/host/activities/${id}?${key}=${q.error ?? q.notice}${hash}`);
}

export async function publishAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const result = await publishHostActivity(id);
  if ("error" in result) back(id, { error: result.error });
  back(id, { notice: result.status === "in_progress" ? "published_running" : "published" });
}

export async function decideAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const code = await decideHostParticipation(
    uuidOf(formData, "participationId"),
    formData.get("approve") === "true",
  );
  back(id, code ? { error: code } : { notice: "decided" }, "#roster");
}

export async function attendanceAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const status = formData.get("status") === "absent" ? "absent" : "attended";
  const code = await markHostAttendance(id, uuidOf(formData, "userId"), status);
  back(id, code ? { error: code } : { notice: "marked" }, "#roster");
}

export async function finalizeAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const code = await finalizeHostChallenge(id);
  back(id, code ? { error: code } : { notice: "finalized" });
}
