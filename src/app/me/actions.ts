"use server";

import { redirect } from "next/navigation";
import { markCalloutsRead, muteHost, setCalloutAccept } from "@/lib/platform/host-callouts";
import { isUuid } from "@/lib/platform/ids";

const back = (q: string): never => redirect(`/me?${q}#callouts`);

/** 받은 소식에서 이 호스트를 끄거나 다시 켠다. */
export async function muteHostAction(formData: FormData) {
  const host = String(formData.get("hostId") ?? "");
  if (!isUuid(host)) throw new Error("invalid host");
  const mute = formData.get("mute") === "true";
  const code = await muteHost(host, mute);
  back(code ? `error=${code}` : `notice=${mute ? "host_muted" : "host_unmuted"}`);
}

/** 지난 활동 호스트의 새 활동 소식 전체 받기/끄기. */
export async function calloutAcceptAction(formData: FormData) {
  const accept = formData.get("accept") === "true";
  const code = await setCalloutAccept(accept);
  back(code ? `error=${code}` : `notice=${accept ? "callout_on" : "callout_off"}`);
}

/** 받은 소식이 화면에 그려진 뒤 읽음으로. */
export async function markCalloutsReadAction() {
  await markCalloutsRead();
}
