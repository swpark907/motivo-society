"use server";

import { redirect } from "next/navigation";
import { deleteMedia, resolveMediaOwner, uploadMedia } from "@/lib/platform/host-media";
import { isUuid } from "@/lib/platform/ids";

export async function uploadMediaAction(formData: FormData) {
  const owner = await resolveMediaOwner(String(formData.get("owner") ?? "me"));
  if (!owner) redirect("/login?next=%2Fhost%2Fmedia");
  const file = formData.get("file");
  const r = await uploadMedia(
    file instanceof File ? file : new File([], ""),
    owner,
    String(formData.get("alt") ?? ""),
  );
  redirect(`/host/media?${"error" in r ? `error=${r.error}` : "notice=media_uploaded"}`);
}

export async function deleteMediaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) throw new Error("invalid id");
  const code = await deleteMedia(id);
  redirect(
    `/host/media?${code ? `error=${code === "not_found" ? "saved_missing" : code}` : "notice=saved_deleted"}`,
  );
}
