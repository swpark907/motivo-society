import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar/Avatar";
import { LineIcon } from "@/components/LineIcon/LineIcon";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { KindTag } from "@/components/KindTag/KindTag";
import { shortDate } from "@/lib/platform/activity-time";
import { getHostAccess } from "@/lib/platform/host";
import { getCalloutSettings, listReceivedCallouts } from "@/lib/platform/host-callouts";
import { errorMessage, noticeMessage } from "@/lib/platform/messages";
import { calloutAcceptAction, muteHostAction } from "./actions";
import { MarkCalloutsRead } from "./MarkCalloutsRead";
import { requireUser } from "@/lib/platform/session";
import { signOut } from "../login/actions";
import s from "./me.module.scss";
import { SubmitButton } from "@/components/SubmitButton/SubmitButton";

export const metadata: Metadata = {
  title: "나",
  description: "내 일정, 주문과 환불, 프로필.",
  robots: { index: false },
};

// 아직 열리지 않은 메뉴는 "준비 중"으로 보여 준다. 없는 기능을 있는 것처럼 보이지 않는다.
const SECTIONS: { title: string; body: string; href?: string }[] = [
  { title: "내 일정", body: "신청한 모임·시즌·챌린지를 날짜순으로", href: "/me/schedule" },
  { title: "주문과 환불", body: "입금 안내, 결제 내역, 환불 요청", href: "/me/orders" },
  { title: "프로필", body: "닉네임과 관심사" },
];

export default async function MePage({ searchParams }: PageProps<"/me">) {
  const sp = await searchParams;
  const user = await requireUser("/me");
  const notice = typeof sp.notice === "string" ? noticeMessage(sp.notice) : null;
  const errorCode = typeof sp.error === "string" && /^[a-z_]+$/.test(sp.error) ? sp.error : null;
  // 지난 활동 호스트가 보낸 새 활동 소식(H11)과 받기 설정.
  const [callouts, settings] = await Promise.all([
    listReceivedCallouts(),
    getCalloutSettings(user.id),
  ]);
  const name = user.nickname ?? user.email.split("@")[0];
  // 호스트 도구는 자격이 있는 사람에게만 보인다(호스트는 계정 종류가 아니라 자격).
  const host = await getHostAccess();
  const sections = host.eligible
    ? [
        ...SECTIONS.slice(0, 2),
        { title: "호스트 도구", body: "내가 연 활동, 처리할 일, 지난 활동 기록", href: "/host" },
        ...SECTIONS.slice(2),
      ]
    : SECTIONS;

  const inbox = (
    <section className={s.callouts} id="callouts" aria-labelledby="callouts-h">
      <h2 id="callouts-h">받은 소식</h2>
      {callouts.length === 0 ? (
        <p className={s.muted}>
          {settings.accept
            ? "내가 다녀온 활동의 호스트가 새 활동을 열면 여기에 소식이 와요."
            : "지난 활동 호스트의 새 활동 소식을 받지 않고 있어요."}
        </p>
      ) : (
        <ul>
          {callouts.map((c) => (
            <li key={c.id} className={s.callout}>
              <p className={s.calloutHead}>
                {!c.read && <span className={s.newBadge}>새 소식</span>}
                <span>{c.host}님이 새 활동을 열었어요</span>
                <small>{shortDate(new Date(c.createdAt))}</small>
              </p>
              <Link href={`/activities/${c.activity.slug}`} className={s.calloutLink}>
                <KindTag kind={c.activity.kind as "gathering" | "series" | "challenge"} />
                <strong>{c.activity.title}</strong>
                <LineIcon name="arrow" />
              </Link>
              {c.message && <p className={s.calloutMessage}>{c.message}</p>}
              <form action={muteHostAction}>
                <input type="hidden" name="hostId" value={c.hostId} />
                <input type="hidden" name="mute" value="true" />
                <SubmitButton className={s.textButton} pendingLabel="끄는 중…">
                  {c.host}님 소식 받지 않기
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
      {callouts.some((c) => !c.read) && <MarkCalloutsRead />}

      <div className={s.calloutSettings}>
        <form action={calloutAcceptAction}>
          <input type="hidden" name="accept" value={String(!settings.accept)} />
          <span>
            지난 활동 호스트의 새 활동 소식 ·{" "}
            <strong>{settings.accept ? "받는 중" : "꺼짐"}</strong>
          </span>
          <SubmitButton className={s.signOut} pendingLabel="바꾸는 중…">
            {settings.accept ? "끄기" : "다시 받기"}
          </SubmitButton>
        </form>
        {settings.muted.length > 0 && (
          <ul aria-label="소식을 끈 호스트">
            {settings.muted.map((m) => (
              <li key={m.id}>
                <span>{m.nickname}님 소식 꺼짐</span>
                <form action={muteHostAction}>
                  <input type="hidden" name="hostId" value={m.id} />
                  <input type="hidden" name="mute" value="false" />
                  <SubmitButton className={s.textButton} pendingLabel="켜는 중…">
                    다시 받기
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  return (
    <PlatformPage label="ME" title="나">
      <section className={s.profile} aria-label="내 계정">
        <Avatar name={name} size={56} />
        <div className={s.who}>
          <p className={s.name}>{name}</p>
          <p className={s.email}>{user.email}</p>
        </div>
        <form action={signOut}>
          <SubmitButton className={s.signOut} pendingLabel="나가는 중…">
            로그아웃
          </SubmitButton>
        </form>
      </section>

      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {errorCode && (
        <p className={s.errorBox} role="alert">
          {errorMessage(errorCode)}
        </p>
      )}

      {callouts.length > 0 && inbox}

      <ul className={s.sections}>
        {sections.map((section) => (
          <li key={section.title}>
            {section.href ? (
              <Link href={section.href} className={s.sectionLink}>
                <div>
                  <p className={s.sectionTitle}>{section.title}</p>
                  <p className={s.sectionBody}>{section.body}</p>
                </div>
                <LineIcon name="arrow" />
              </Link>
            ) : (
              <>
                <div>
                  <p className={s.sectionTitle}>{section.title}</p>
                  <p className={s.sectionBody}>{section.body}</p>
                </div>
                <span className={s.soon}>준비 중</span>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* 받은 소식이 없으면 메뉴 아래로 내린다(대부분의 회원에게 비어 있어서). */}
      {callouts.length === 0 && inbox}
    </PlatformPage>
  );
}
