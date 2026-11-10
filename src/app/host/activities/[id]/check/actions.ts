"use server";

import { markHostAttendance } from "@/lib/platform/host";
import { errorMessage } from "@/lib/platform/messages";
import { isUuid } from "@/lib/platform/ids";

/** 빠른 출석: 한 사람의 출석을 바로 기록한다(화면을 다시 불러오지 않는다). 권한·시각은 DB가 다시 본다. */
export async function quickMarkAction(
  activityId: string,
  userId: string,
  status: "attended" | "absent",
): Promise<{ error: string | null }> {
  if (!isUuid(activityId) || !isUuid(userId)) return { error: errorMessage("not_found") };
  if (status !== "attended" && status !== "absent")
    return { error: errorMessage("invalid_status") };
  const code = await markHostAttendance(activityId, userId, status);
  return { error: code ? errorMessage(code) : null };
}
