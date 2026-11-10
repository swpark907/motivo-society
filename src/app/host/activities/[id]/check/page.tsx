import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { clockTime, shortDate } from "@/lib/platform/activity-time";
import { getHostActivity } from "@/lib/platform/host";
import { attendanceOpensAt, canCheckAttendance } from "@/lib/platform/host-activity-view";
import { requireUser } from "@/lib/platform/session";
import { QuickCheck } from "./QuickCheck";
import { isUuid } from "@/lib/platform/ids";

export const metadata: Metadata = {
  title: "빠른 출석",
  robots: { index: false },
};

// 현장에서 휴대폰 한 손으로 쓰는 출석 체크(H09). 모임과 시즌 회차만.
export default async function CheckPage({ params }: PageProps<"/host/activities/[id]/check">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  await requireUser(`/host/activities/${id}/check`);
  const result = await getHostActivity(id);
  if (!result.found || !result.canManage) notFound();
  const a = result.activity;
  const back = { href: `/host/activities/${id}`, label: "활동 관리" };
  const now = new Date();
  const people = a.roster
    .filter((r) => r.status === "confirmed")
    .sort((x, y) => x.nickname.localeCompare(y.nickname, "ko"))
    .map((r) => ({ userId: r.userId, nickname: r.nickname, attendance: r.attendance }));

  let blocked: { title: string; body?: string } | null = null;
  if (a.kind !== "gathering") {
    blocked = {
      title: "출석은 모임과 시즌 회차에서 체크해요",
      body: a.kind === "series" ? "시즌 관리 화면의 회차 목록에서 회차를 골라 주세요." : undefined,
    };
  } else if (a.status === "cancelled") {
    blocked = { title: "취소된 모임이에요" };
  } else if (!canCheckAttendance(a.startsAt, now)) {
    const opens = attendanceOpensAt(a.startsAt!);
    blocked = {
      title: "아직 출석을 체크할 수 없어요",
      body: `시작 1시간 전인 ${shortDate(opens)} ${clockTime(opens)}부터 열려요.`,
    };
  } else if (people.length === 0) {
    blocked = { title: "확정된 참가자가 없어요" };
  }

  return (
    <PlatformPage label="HOST · CHECK-IN" title={a.title} back={back}>
      {blocked ? (
        <EmptyState
          title={blocked.title}
          body={blocked.body}
          action={{ href: back.href, label: "활동 관리로" }}
        />
      ) : (
        <QuickCheck activityId={a.id} people={people} />
      )}
    </PlatformPage>
  );
}
