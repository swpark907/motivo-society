import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clockTime, gatheringWhen, periodWhen, shortDate } from "@/lib/platform/activity-time";
import { getHostActivity, logRosterExport } from "@/lib/platform/host";
import { groupRoster } from "@/lib/platform/host-activity-view";
import { requireUser } from "@/lib/platform/session";
import { PrintButton } from "./PrintButton";
import s from "./print.module.scss";
import { isUuid } from "@/lib/platform/ids";

export const metadata: Metadata = {
  title: "출석표",
  robots: { index: false },
};

// 현장에서 쓸 종이 출석표(H09). 확정된 사람만 표에, 대기자는 아래 짧게. 열 때마다 감사 기록을 남긴다.
export default async function PrintPage({ params }: PageProps<"/host/activities/[id]/print">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  await requireUser(`/host/activities/${id}/print`);
  const result = await getHostActivity(id);
  if (!result.found || !result.canManage) notFound();
  await logRosterExport(id, "print");

  const a = result.activity;
  const now = new Date();
  const groups = groupRoster(a.roster);
  const confirmed = groups.find((g) => g.status === "confirmed")?.rows ?? [];
  const waiting = groups.find((g) => g.status === "waitlisted")?.rows ?? [];
  const when = !a.startsAt
    ? "일정 미정"
    : a.kind === "gathering"
      ? gatheringWhen(new Date(a.startsAt), now)
      : periodWhen(new Date(a.startsAt), a.endsAt ? new Date(a.endsAt) : null);

  return (
    <main className={`paper ${s.page}`}>
      <div className={s.sheet}>
        <div className={s.screenOnly}>
          <Link href={`/host/activities/${id}`}>← 활동 관리로</Link>
          <PrintButton className={s.print} />
        </div>

        <header className={s.head}>
          <p>출석표</p>
          <h1>{a.title}</h1>
          <p>{[when, a.place].filter(Boolean).join(" · ")}</p>
        </header>

        {confirmed.length === 0 ? (
          <p>확정된 참가자가 아직 없어요.</p>
        ) : (
          <table className={s.table}>
            <caption>확정 {confirmed.length}명</caption>
            <thead>
              <tr>
                <th scope="col">번호</th>
                <th scope="col">닉네임</th>
                <th scope="col">출석</th>
                <th scope="col">메모</th>
              </tr>
            </thead>
            <tbody>
              {confirmed.map((r, i) => (
                <tr key={r.participationId}>
                  <td>{i + 1}</td>
                  <td>{r.nickname}</td>
                  <td>
                    {r.attendance === "attended"
                      ? "참석"
                      : r.attendance === "absent"
                        ? "불참"
                        : "□"}
                  </td>
                  <td />
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {waiting.length > 0 && (
          <p className={s.waiting}>대기 {waiting.map((r) => r.nickname).join(", ")}</p>
        )}

        <p className={s.foot}>
          {shortDate(now)} {clockTime(now)} 기준 · motivo society
        </p>
      </div>
    </main>
  );
}
