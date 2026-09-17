import { Carousel } from "@/components/Carousel/Carousel";
import { LibraryCategoryCard } from "@/components/LibraryCategoryCard/LibraryCategoryCard";
import { Section } from "@/components/Section/Section";
import { YardCard } from "@/components/YardCard/YardCard";
import { LIBRARY_CATEGORIES, getAllLibraryItems } from "@/lib/content/library";
import { getAllYardItems } from "@/lib/content/yard";
import styles from "./page.module.scss";

export default async function Home() {
  const [yard, library] = await Promise.all([getAllYardItems(), getAllLibraryItems()]);
  const countBy = (id: string) => library.filter((i) => i.category === id).length;

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

      <Section title="모쏘와 함께하는 클래스와 모임" label="Yard" href="/yard">
        <Carousel label="Yard">
          {yard.map((item) => (
            <YardCard key={item.slug} item={item} />
          ))}
        </Carousel>
      </Section>

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
