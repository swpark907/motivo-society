import type { Metadata } from "next";
import { ClubCard } from "@/components/ClubCard/ClubCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { listClubsFor } from "@/lib/platform/clubs";
import { getCurrentUser } from "@/lib/platform/session";
import styles from "../explore/page.module.scss";
import s from "./clubs.module.scss";

export const metadata: Metadata = {
  title: "클럽",
  description: "같은 관심사로 모여 함께 만들고 배우는 클럽을 찾아보세요.",
};

export default async function ClubsPage() {
  const user = await getCurrentUser();
  const { available, mine, all } = await listClubsFor(user?.id ?? null);
  const mineIds = new Set(mine.map((c) => c.id));
  const others = all.filter((c) => !mineIds.has(c.id));

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
      ) : (
        <>
          {mine.length > 0 && (
            <section aria-labelledby="mine-h" className={s.section}>
              <h2 id="mine-h" className={s.head}>
                내 클럽
              </h2>
              <ul className={styles.grid}>
                {mine.map((c) => (
                  <li key={c.id}>
                    <ClubCard
                      club={c}
                      href={`/clubs/${c.slug}`}
                      badge={c.myStatus === "pending" ? "승인 대기" : "멤버"}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="all-h" className={s.section}>
            <h2 id="all-h" className={s.head}>
              {mine.length > 0 ? "다른 클럽 찾기" : "클럽 찾기"}
            </h2>
            {others.length === 0 ? (
              <EmptyState
                title={all.length === 0 ? "아직 열린 클럽이 없어요" : "모든 클럽에 함께하고 있어요"}
              />
            ) : (
              <ul className={styles.grid} aria-label="클럽 목록">
                {others.map((c) => (
                  <li key={c.id}>
                    <ClubCard club={c} href={`/clubs/${c.slug}`} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PlatformPage>
  );
}
