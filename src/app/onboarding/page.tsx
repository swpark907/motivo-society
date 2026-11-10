import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/platform/auth-paths";
import { listActiveInterests } from "@/lib/platform/profile";
import { requireSignedIn } from "@/lib/platform/session";
import { OnboardingForm } from "./OnboardingForm";
import s from "./onboarding.module.scss";

export const metadata: Metadata = {
  title: "처음 오셨네요",
  robots: { index: false },
};

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const here = next === "/" ? "/onboarding" : `/onboarding?next=${encodeURIComponent(next)}`;
  const user = await requireSignedIn(here);
  if (user.onboarded) redirect(next);
  const interests = await listActiveInterests();

  return (
    <main data-platform className={`paper ${s.page}`}>
      <div className={s.inner}>
        <p className="label">WELCOME</p>
        <h1 className={s.title}>모쏘에서 쓸 이름을 정해 주세요</h1>
        <p className={s.lead}>
          닉네임과 관심사만 정하면 바로 시작할 수 있어요. 닉네임은 모임과 클럽에서 다른 사람에게
          보여요.
        </p>
        <OnboardingForm interests={interests} next={next} />
      </div>
    </main>
  );
}
