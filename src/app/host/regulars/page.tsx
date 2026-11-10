import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar/Avatar";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { shortDate } from "@/lib/platform/activity-time";
import { getRegulars } from "@/lib/platform/host-callouts";
import { requireUser } from "@/lib/platform/session";
import s from "./regulars.module.scss";

export const metadata: Metadata = {
  title: "단골",
  robots: { index: false },
};

// 내가 연 활동에 함께한 사람들(H11). 출석 기록은 참고용이며 신청 제한·제재에 쓰지 않는다.
export default async function RegularsPage() {
  await requireUser("/host/regulars");
  const regulars = await getRegulars();

  return (
    <PlatformPage
      label="HOST · REGULARS"
      title="단골"
      lead="내가 연 활동에 확정됐던 사람들이에요. 자주 함께한 순서로 보여요."
      back={{ href: "/host", label: "호스트 도구" }}
    >
      <p className={s.note}>
        출석 기록은 서로를 기억하기 위한 참고용이에요. 신청을 막거나 제재하는 데 쓰지 않아요.
      </p>
      {regulars.length === 0 ? (
        <EmptyState
          title="아직 함께한 사람이 없어요"
          body="활동에 참가가 확정된 사람이 생기면 여기에 쌓여요."
          action={{ href: "/host", label: "내가 연 활동 보기" }}
        />
      ) : (
        <ul className={s.list} aria-label="함께한 사람">
          {regulars.map((r) => (
            <li key={r.userId} className={s.row}>
              <Avatar name={r.nickname} size={40} />
              <div className={s.who}>
                <strong>{r.nickname}</strong>
                <small>
                  {r.lastAt ? `최근 ${shortDate(new Date(r.lastAt))}` : ""}
                  {r.attended + r.absent > 0
                    ? ` · 출석 체크 ${r.attended + r.absent}번 중 참석 ${r.attended}`
                    : " · 출석 체크 기록 없음"}
                </small>
              </div>
              <span className={s.times}>
                <strong>{r.times}</strong>번
              </span>
            </li>
          ))}
        </ul>
      )}
    </PlatformPage>
  );
}
