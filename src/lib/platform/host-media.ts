import { randomUUID } from "node:crypto";
import { errorCodeFrom } from "./messages";
import { MEDIA_BUCKET, MEDIA_MAX_BYTES, mediaPath, mediaUrl, sniffImage } from "./media";
import { getCurrentUser } from "./session";
import { createSessionClient } from "./supabase-server";
import { isUuid } from "./ids";

// 이미지 보관함(H06). 파일은 Storage media 버킷, 목록은 media_assets. 권한은 Storage 정책과 DB 함수가 정한다.

export type MediaAsset = {
  id: string;
  path: string;
  url: string;
  alt: string;
  clubId: string | null;
  createdAt: string;
};

export type MediaOwner = { kind: "user"; id: string } | { kind: "club"; id: string };

/** 보관함 고르기 값("me" 또는 클럽 id) → 주인. 클럽 권한은 Storage 정책과 DB 함수가 다시 본다. */
export async function resolveMediaOwner(value: string): Promise<MediaOwner | null> {
  if (isUuid(value)) return { kind: "club", id: value };
  const user = await getCurrentUser();
  return user ? { kind: "user", id: user.id } : null;
}

/** 내가 볼 수 있는 보관함 이미지 전부(내 것 + 활동을 열 수 있는 클럽의 것), 최근 순. */
export async function listMedia(): Promise<MediaAsset[]> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("media_assets")
    .select("id, path, alt, club_id, created_at")
    // 영수증(장부)은 이미지 보관함에 섞지 않는다.
    .eq("purpose", "image")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    path: r.path,
    url: mediaUrl(r.path),
    alt: r.alt ?? "",
    clubId: r.club_id,
    createdAt: r.created_at,
  }));
}

/**
 * 파일을 올리고 보관함에 등록한다. 형식은 파일 앞부분으로 확인하고(jpg · png · webp), 5MB까지.
 * 등록이 실패하면 올린 파일을 되돌려 지운다.
 */
export async function uploadMedia(
  file: File,
  owner: MediaOwner,
  alt: string,
  purpose: "image" | "receipt" = "image",
): Promise<{ id: string } | { error: string }> {
  if (!file || file.size === 0) return { error: "file_required" };
  if (file.size > MEDIA_MAX_BYTES) return { error: "file_too_big" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { error: "not_image" };

  const supabase = await createSessionClient();
  const path = mediaPath(owner, randomUUID(), kind.ext);
  const { error: upErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, { contentType: kind.mime, upsert: false });
  if (upErr)
    return {
      error: /row-level security|unauthorized/i.test(upErr.message) ? "forbidden" : "upload_failed",
    };

  const { data, error } = await supabase.rpc("media_register", {
    p_path: path,
    p_alt: alt,
    p_purpose: purpose,
  });
  if (error || typeof data !== "string") {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    return { error: errorCodeFrom(error?.message) };
  }
  return { id: data };
}

/** 보관함에서 지우고 파일도 지운다. 표지로 쓰는 중이면 DB가 막는다(media_in_use). */
export async function deleteMedia(id: string): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("media_delete", { p_id: id });
  if (error) return errorCodeFrom(error.message);
  if (typeof data === "string") await supabase.storage.from(MEDIA_BUCKET).remove([data]);
  return null;
}

/** 활동 표지를 정하거나(media id) 뺀다(null). */
export async function setActivityCover(
  activityId: string,
  mediaId: string | null,
): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("activity_set_cover", {
    p_activity: activityId,
    ...(mediaId ? { p_media: mediaId } : {}),
  });
  return error ? errorCodeFrom(error.message) : null;
}
