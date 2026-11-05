import type { Metadata } from "next";
import { ClubCard } from "@/components/ClubCard/ClubCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { listClubs } from "@/lib/platform/queries";
import styles from "../explore/page.module.scss";

export const metadata: Metadata = {
  title: "클럽",
  description: "같은 관심사로 모여 함께 만들고 배우는 클럽을 찾아보세요.",
};

export default async function ClubsPage() {
  const { available, items } = await listClubs();
  return (
    <PlatformPage
      label="CLUBS"
      title="클럽"
      lead="같은 관심사로 모여 꾸준히 함께하는 곳이에요. 클럽 안에서 모임과 챌린지가 열려요."
    >
      {!available ? (
        <EmptyState
          title="클럽을 불러올 수 없어요"
          body="데이터 연결이 준비되지 않았어요. 잠시 뒤 다시 들어와 주세요."
        />
      ) : items.length === 0 ? (
        <EmptyState title="아직 열린 클럽이 없어요" />
      ) : (
        <ul className={styles.grid} aria-label="클럽 목록">
          {items.map((c) => (
            <li key={c.id}>
              <ClubCard club={c} />
            </li>
          ))}
        </ul>
      )}
    </PlatformPage>
  );
}
