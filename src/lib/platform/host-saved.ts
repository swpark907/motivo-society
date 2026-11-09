import { templateDraft, type Draft } from "./activity-draft";
import type { Json } from "./database.types";
import { errorCodeFrom } from "./messages";
import { createSessionClient } from "./supabase-server";

// 호스트 보관함(H05): 활동 양식 · 장소 즐겨찾기 · 공지 문구. 본인 것만 읽히고(RLS), 쓰기는 DB 함수로.

export type SavedTemplate = { id: string; name: string; updatedAt: string; draft: Draft | null };
export type SavedPlace = { id: string; name: string; area: string; addressDetail: string };
export type SavedSnippet = { id: string; title: string; body: string };

export type Saved = { templates: SavedTemplate[]; places: SavedPlace[]; snippets: SavedSnippet[] };

export async function listSaved(): Promise<Saved> {
  const supabase = await createSessionClient();
  const [t, p, s] = await Promise.all([
    supabase
      .from("activity_templates")
      .select("id, name, data, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("saved_places")
      .select("id, name, area, address_detail")
      .order("updated_at", { ascending: false }),
    supabase
      .from("saved_snippets")
      .select("id, title, body")
      .order("updated_at", { ascending: false }),
  ]);
  return {
    templates: (t.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      updatedAt: r.updated_at,
      draft: templateDraft(r.data),
    })),
    places: (p.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      area: r.area ?? "",
      addressDetail: r.address_detail ?? "",
    })),
    snippets: (s.data ?? []).map((r) => ({ id: r.id, title: r.title, body: r.body })),
  };
}

type Result = { id: string } | { error: string };

function result(data: unknown, error: { message: string } | null): Result {
  return error || typeof data !== "string"
    ? { error: errorCodeFrom(error?.message) }
    : { id: data };
}

export async function saveTemplate(name: string, draft: Draft): Promise<Result> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("template_save", {
    p_name: name,
    p_data: draft as unknown as Json,
  });
  return result(data, error);
}

export async function savePlace(
  place: { name: string; area: string; addressDetail: string },
  id?: string,
): Promise<Result> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("place_save", {
    p_name: place.name,
    p_area: place.area,
    p_address_detail: place.addressDetail,
    p_id: id,
  });
  return result(data, error);
}

export async function saveSnippet(
  snippet: { title: string; body: string },
  id?: string,
): Promise<Result> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("snippet_save", {
    p_title: snippet.title,
    p_body: snippet.body,
    p_id: id,
  });
  return result(data, error);
}

export async function deleteSaved(
  kind: "template" | "place" | "snippet",
  id: string,
): Promise<string | null> {
  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("saved_delete", { p_kind: kind, p_id: id });
  return error ? errorCodeFrom(error.message) : null;
}
