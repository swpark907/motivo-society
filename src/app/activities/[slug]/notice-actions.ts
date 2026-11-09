"use server";

import { markNoticesRead } from "@/lib/platform/host-notices";

/** 활동 화면을 연 참가자의 공지를 읽음으로(호스트는 읽은 사람 수를 본다). */
export async function markNoticesReadAction(activityId: string) {
  if (!/^[0-9a-f-]{36}$/.test(activityId)) return;
  await markNoticesRead(activityId);
}
