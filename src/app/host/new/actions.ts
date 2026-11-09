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
