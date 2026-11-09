"use server";

import { redirect } from "next/navigation";
import {
  decideHostParticipation,
  finalizeHostChallenge,
  markHostAttendance,
  publishHostActivity,
} from "@/lib/platform/host";
import { deleteLedgerEntry, saveLedgerEntry, setLedgerPublic } from "@/lib/platform/host-ledger";
import { resolveMediaOwner, setActivityCover, uploadMedia } from "@/lib/platform/host-media";

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

/** 보관함 이미지로 표지를 바꾸거나(mediaId), 뺀다(빈 값). */
export async function setCoverAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const media = String(formData.get("mediaId") ?? "");
  if (media && !UUID.test(media)) throw new Error("invalid mediaId");
  const code = await setActivityCover(id, media || null);
  back(id, code ? { error: code } : { notice: media ? "cover_set" : "cover_cleared" }, "#cover");
}

/** 새 이미지를 올리고 바로 표지로 쓴다. 올린 이미지는 고른 보관함에 남는다. */
export async function uploadCoverAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const owner = await resolveMediaOwner(String(formData.get("owner") ?? "me"));
  if (!owner) back(id, { error: "auth_required" }, "#cover");
  const file = formData.get("file");
  const up = await uploadMedia(
    file instanceof File ? file : new File([], ""),
    owner,
    String(formData.get("alt") ?? ""),
  );
  if ("error" in up) back(id, { error: up.error }, "#cover");
  const code = await setActivityCover(id, up.id);
  back(id, code ? { error: code } : { notice: "cover_set" }, "#cover");
}

// ── 장부(H07)

export async function saveLedgerAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const entry = String(formData.get("entryId") ?? "");
  if (entry && !UUID.test(entry)) throw new Error("invalid entryId");
  const amount = Number(String(formData.get("amount") ?? "").replaceAll(",", ""));
  const file = formData.get("receipt");
  const code = await saveLedgerEntry(
    id,
    {
      kind: formData.get("kind") === "income" ? "income" : "expense",
      amount: Number.isInteger(amount) ? amount : 0,
      memo: String(formData.get("memo") ?? ""),
      occurredOn: /^\d{4}-\d{2}-\d{2}$/.test(String(formData.get("occurredOn")))
        ? String(formData.get("occurredOn"))
        : "",
      receipt: file instanceof File && file.size > 0 ? file : null,
    },
    entry || undefined,
  );
  back(id, code ? { error: code } : { notice: "ledger_saved" }, "#ledger");
}

export async function deleteLedgerAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const code = await deleteLedgerEntry(uuidOf(formData, "entryId"));
  back(id, code ? { error: code } : { notice: "ledger_deleted" }, "#ledger");
}

export async function ledgerPublicAction(formData: FormData) {
  const id = uuidOf(formData, "activityId");
  const open = formData.get("public") === "true";
  const code = await setLedgerPublic(id, open);
  back(
    id,
    code ? { error: code } : { notice: open ? "ledger_public" : "ledger_private" },
    "#ledger",
  );
}
