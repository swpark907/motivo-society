"use server";

import { redirect } from "next/navigation";
import { deleteSaved, savePlace, saveSnippet } from "@/lib/platform/host-saved";

const UUID = /^[0-9a-f-]{36}$/;
const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

function idOf(formData: FormData): string | undefined {
  const id = text(formData, "id");
  if (!id) return undefined;
  if (!UUID.test(id)) throw new Error("invalid id");
  return id;
}

/** 결과는 보관함의 같은 칸으로. DB가 not_found를 주면 "이미 지웠거나 내 것이 아님". */
function back(section: string, code: string | null, notice: string): never {
  const q = code ? `error=${code === "not_found" ? "saved_missing" : code}` : `notice=${notice}`;
  redirect(`/host/saved?${q}#${section}`);
}

export async function savePlaceAction(formData: FormData) {
  const r = await savePlace(
    {
      name: text(formData, "name"),
      area: text(formData, "area"),
      addressDetail: text(formData, "addressDetail"),
    },
    idOf(formData),
  );
  back("places", "error" in r ? r.error : null, "place_saved");
}

export async function saveSnippetAction(formData: FormData) {
  const r = await saveSnippet(
    { title: text(formData, "title"), body: text(formData, "body") },
    idOf(formData),
  );
  back("snippets", "error" in r ? r.error : null, "snippet_saved");
}

export async function deleteSavedAction(formData: FormData) {
  const kind = text(formData, "kind");
  if (kind !== "template" && kind !== "place" && kind !== "snippet")
    throw new Error("invalid kind");
  const id = idOf(formData);
  if (!id) throw new Error("missing id");
  back(`${kind}s`, await deleteSaved(kind, id), "saved_deleted");
}
