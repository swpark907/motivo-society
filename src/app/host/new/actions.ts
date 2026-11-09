"use server";

import { redirect } from "next/navigation";
import {
  firstInvalidStep,
  organizerChoices,
  parseDraft,
  toCreatePayload,
  type Errors,
  type StepId,
} from "@/lib/platform/activity-draft";
import { createHostActivity, getCreateOptions } from "@/lib/platform/host";
import { savePlace, saveTemplate, type SavedPlace } from "@/lib/platform/host-saved";
import { errorMessage } from "@/lib/platform/messages";

export type CreateState = { error: string | null; step: StepId | null; errors: Errors };

/** 화면의 단계 검사를 한 번 더 하고 초안으로 만든다. 성공하면 그 활동의 관리 화면으로. */
export async function createAction(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const draft = parseDraft(String(formData.get("draft") ?? ""));
  if (!draft) {
    return { error: "입력을 읽지 못했어요. 새로고침한 뒤 다시 해 주세요.", step: null, errors: {} };
  }
  const choices = organizerChoices(await getCreateOptions());
  const invalid = firstInvalidStep(draft, choices, new Date());
  if (invalid) return { error: null, step: invalid.step, errors: invalid.errors };

  const result = await createHostActivity(toCreatePayload(draft));
  if ("error" in result) return { error: errorMessage(result.error), step: null, errors: {} };
  redirect(`/host/activities/${result.id}?notice=activity_created`);
}

/** 확인 단계의 "양식으로 저장". 같은 이름이 있으면 새 내용으로 바꾼다(DB가 일정 칸은 빼고 저장). */
export async function saveTemplateAction(
  name: string,
  draftJson: string,
): Promise<{ error: string | null }> {
  const draft = parseDraft(draftJson);
  if (!draft) return { error: errorMessage("invalid_template") };
  const r = await saveTemplate(name, draft);
  return { error: "error" in r ? errorMessage(r.error) : null };
}

/** 기본 정보 단계의 "이 장소 저장". 저장한 장소를 돌려줘 목록에 바로 더한다. */
export async function quickSavePlaceAction(place: {
  name: string;
  area: string;
  addressDetail: string;
}): Promise<{ place: SavedPlace } | { error: string }> {
  const clean = {
    name: String(place.name ?? "").trim(),
    area: String(place.area ?? "").trim(),
    addressDetail: String(place.addressDetail ?? "").trim(),
  };
  const r = await savePlace(clean);
  return "error" in r ? { error: errorMessage(r.error) } : { place: { id: r.id, ...clean } };
}
