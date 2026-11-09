import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar/Avatar";
import { LineIcon } from "@/components/LineIcon/LineIcon";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { requireUser } from "@/lib/platform/session";
import { signOut } from "../login/actions";
import s from "./me.module.scss";

export const metadata: Metadata = {
  title: "나",
  description: "내 일정, 주문과 환불, 프로필.",
  robots: { index: false },
};

// 아직 열리지 않은 메뉴는 "준비 중"으로 보여 준다. 없는 기능을 있는 것처럼 보이지 않는다.
const SECTIONS: { title: string; body: string; href?: string }[] = [
  { title: "내 일정", body: "신청한 모임·시즌·챌린지를 날짜순으로", href: "/me/schedule" },
  { title: "주문과 환불", body: "입금 안내, 결제 내역, 환불 요청" },
  { title: "프로필", body: "닉네임과 관심사" },
];

export default async function MePage() {
  const user = await requireUser("/me");
  const name = user.nickname ?? user.email.split("@")[0];

  return (
    <PlatformPage label="ME" title="나">
      <section className={s.profile} aria-label="내 계정">
        <Avatar name={name} size={56} />
        <div className={s.who}>
          <p className={s.name}>{name}</p>
          <p className={s.email}>{user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className={s.signOut}>
            로그아웃
          </button>
        </form>
      </section>

      <ul className={s.sections}>
        {SECTIONS.map((section) => (
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
    </PlatformPage>
  );
}
