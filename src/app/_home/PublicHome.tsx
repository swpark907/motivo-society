import { ActivityCard } from "@/components/ActivityCard/ActivityCard";
import { Carousel } from "@/components/Carousel/Carousel";
import { LibraryCategoryCard } from "@/components/LibraryCategoryCard/LibraryCategoryCard";
import { Section } from "@/components/Section/Section";
import { LIBRARY_CATEGORIES, getAllLibraryItems } from "@/lib/content/library";
import { EMPTY_FILTERS, matchesFilters } from "@/lib/platform/explore-filters";
import { listOpenActivities } from "@/lib/platform/queries";
import styles from "../page.module.scss";

/** 비로그인 홈: 브랜드 히어로 + 이번 주 활동 + Library. 시네마틱 브랜드 화면을 유지한다. */
export async function PublicHome() {
  const now = new Date();
  const [{ items }, library] = await Promise.all([listOpenActivities(now), getAllLibraryItems()]);
  const countBy = (id: string) => library.filter((i) => i.category === id).length;
  // 이번 주 것이 먼저, 모자라면 가까운 날짜순으로 채운다.
  const thisWeek = items.filter((a) =>
    matchesFilters(a, { ...EMPTY_FILTERS, when: "this-week" }, now),
  );
  const activities = [...thisWeek, ...items.filter((a) => !thisWeek.includes(a))].slice(0, 8);
  // 다음 주 이후 것이 섞이면 "이번 주"라고 부르지 않는다.
  const allThisWeek = activities.every((a) => thisWeek.includes(a));

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={`display ${styles.heroTitle}`}>
          <span>배우고,</span>
          <span>만들고,</span>
          <span className={styles.heroAccent}>발견하는</span>
        </h1>
        <p className={styles.heroLead}>테크 기반 컬쳐클럽 — 모티보 소사이어티</p>
      </section>

      {activities.length > 0 && (
        <Section
          title={allThisWeek ? "이번 주 모쏘에서 열리는 것" : "곧 모쏘에서 열리는 것"}
          label={allThisWeek ? "This week" : "Coming up"}
          href="/explore"
        >
          <Carousel label="곧 열리는 활동">
            {activities.map((a) => (
              <ActivityCard key={a.id} activity={a} now={now} href={`/activities/${a.slug}`} />
            ))}
          </Carousel>
        </Section>
      )}

      <Section title="기술 분야의 모든 것" label="Library" href="/library">
        <Carousel label="Library">
          {LIBRARY_CATEGORIES.map((c) => (
            <LibraryCategoryCard key={c.id} category={c} count={countBy(c.id)} />
          ))}
        </Carousel>
      </Section>
    </main>
  );
}
