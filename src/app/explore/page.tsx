import type { Metadata } from "next";
import { ActivityCard } from "@/components/ActivityCard/ActivityCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { listOpenActivities } from "@/lib/platform/queries";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "발견",
  description: "지금 모집 중인 모임·시즌·챌린지를 찾아보세요.",
};

export default async function ExplorePage() {
  const { available, items } = await listOpenActivities();
  return (
    <PlatformPage
      label="EXPLORE"
      title="발견"
      lead="지금 모집 중이거나 중간에 합류할 수 있는 모임·시즌·챌린지예요. 카드 색이 활동 종류를 뜻해요."
    >
      {!available ? (
        <EmptyState
          title="활동을 불러올 수 없어요"
          body="데이터 연결이 준비되지 않았어요. 잠시 뒤 다시 들어와 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="지금 모집 중인 활동이 없어요"
          body="클럽에 들어가면 새 활동 소식을 먼저 볼 수 있어요."
          action={{ href: "/clubs", label: "클럽 둘러보기" }}
        />
      ) : (
        <section aria-label="모집 중인 활동">
          <p className={styles.count}>{items.length}개</p>
          <ul className={styles.grid}>
            {items.map((a) => (
              <li key={a.id}>
                <ActivityCard activity={a} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </PlatformPage>
  );
}
