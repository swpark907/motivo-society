import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { organizerChoices } from "@/lib/platform/activity-draft";
import { getCreateOptions, listHostActivities } from "@/lib/platform/host";
import { requireUser } from "@/lib/platform/session";
import { NewActivityForm } from "./NewActivityForm";

export const metadata: Metadata = {
  title: "활동 만들기",
  robots: { index: false },
};

export default async function NewActivityPage() {
  await requireUser("/host/new");
  const [options, mine] = await Promise.all([getCreateOptions(), listHostActivities()]);
  const choices = organizerChoices(options);

  return (
    <PlatformPage
      label="HOST · NEW"
      title="활동 만들기"
      lead="만들면 초안으로 저장돼요. 관리 화면에서 확인하고 공개해야 발견에 보여요."
      back={{ href: "/host", label: "호스트 도구" }}
    >
      {choices.length === 0 ? (
        <EmptyState
          title="아직 활동을 열 수 있는 자격이 없어요"
          body="호스트 자격이 있거나, 클럽에서 모임·시즌·챌린지를 여는 역할을 맡으면 여기서 만들 수 있어요."
          action={{ href: "/host", label: "호스트 도구로" }}
        />
      ) : (
        <NewActivityForm
          choices={choices}
          previous={mine
            .filter((a) => a.status !== "draft" && a.status !== "cancelled")
            .map((a) => ({ id: a.id, title: a.title }))}
        />
      )}
    </PlatformPage>
  );
}
