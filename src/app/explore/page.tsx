import type { Metadata } from "next";
import Link from "next/link";
import { ActivityCard } from "@/components/ActivityCard/ActivityCard";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import {
  EMPTY_FILTERS,
  exploreHref,
  hasFilters,
  matchesFilters,
  parseExploreFilters,
  type ExploreFilters,
} from "@/lib/platform/explore-filters";
import { listOpenActivities, type ActivityCardData } from "@/lib/platform/queries";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "둘러보기",
  description: "지금 모집 중인 모임·시즌·챌린지를 찾아보세요.",
};

type Chip = { label: string; change: Partial<ExploreFilters>; on: (f: ExploreFilters) => boolean };

const CHIP_GROUPS: { label: string; chips: Chip[] }[] = [
  {
    label: "종류",
    chips: [
      { label: "모임", change: { kind: "gathering" }, on: (f) => f.kind === "gathering" },
      { label: "시즌", change: { kind: "series" }, on: (f) => f.kind === "series" },
      { label: "챌린지", change: { kind: "challenge" }, on: (f) => f.kind === "challenge" },
    ],
  },
  {
    label: "형식",
    chips: [
      { label: "온라인", change: { format: "online" }, on: (f) => f.format === "online" },
      { label: "오프라인", change: { format: "offline" }, on: (f) => f.format === "offline" },
    ],
  },
  {
    label: "기간",
    chips: [
      { label: "이번 주", change: { when: "this-week" }, on: (f) => f.when === "this-week" },
      { label: "다음 주", change: { when: "next-week" }, on: (f) => f.when === "next-week" },
    ],
  },
  { label: "비용", chips: [{ label: "무료", change: { free: true }, on: (f) => f.free }] },
];

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const filters = parseExploreFilters(await searchParams);
  const now = new Date();
  const { available, items } = await listOpenActivities(now);
  const filtering = hasFilters(filters);

  return (
    <PlatformPage
      label="EXPLORE"
      title="둘러보기"
      lead="함께할 모임·시즌·챌린지를 찾아보세요. 진행 중이어도 중간에 합류할 수 있는 것까지 보여요."
    >
      <nav className={styles.filters} aria-label="활동 거르기">
        {CHIP_GROUPS.map((group) => (
          <ul key={group.label} className={styles.group} aria-label={group.label}>
            {group.chips.map((chip) => {
              const on = chip.on(filters);
              return (
                <li key={chip.label}>
                  <Link
                    href={exploreHref(filters, chip.change)}
                    className={styles.chip}
                    data-on={on || undefined}
                    aria-label={on ? `${chip.label}, 선택됨` : chip.label}
                    scroll={false}
                  >
                    {chip.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>

      {!available ? (
        <EmptyState
          title="활동을 불러올 수 없어요"
          body="데이터 연결이 준비되지 않았어요. 잠시 뒤 다시 들어와 주세요."
        />
      ) : filtering ? (
        <Filtered items={items.filter((a) => matchesFilters(a, filters, now))} now={now} />
      ) : (
        <Overview items={items} now={now} />
      )}
    </PlatformPage>
  );
}

/** 필터를 고르지 않았을 때: 이번 주 → 합류 가능 → 전체. */
function Overview({ items, now }: { items: ActivityCardData[]; now: Date }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="지금 모집 중인 활동이 없어요"
        body="클럽에 들어가면 새 활동 소식을 먼저 볼 수 있어요."
        action={{ href: "/clubs", label: "클럽 둘러보기" }}
      />
    );
  }
  const thisWeek = items.filter(
    (a) => a.status === "open" && matchesFilters(a, { ...EMPTY_FILTERS, when: "this-week" }, now),
  );
  const joinable = items.filter((a) => a.status === "in_progress");
  return (
    <>
      {thisWeek.length > 0 && (
        <Section
          title="이번 주에 열리는 것"
          sub="일요일까지 시작하는 모임·시즌"
          more={{ href: exploreHref(EMPTY_FILTERS, { when: "this-week" }), label: "이번 주 모두" }}
        >
          <CardRow items={thisWeek} now={now} />
        </Section>
      )}
      {joinable.length > 0 && (
        <Section
          title="지금 합류할 수 있어요"
          sub="이미 시작했지만 중간부터 함께할 수 있는 시즌·챌린지"
        >
          <CardRow items={joinable} now={now} />
        </Section>
      )}
      <Section title="전체 활동" sub={`${items.length}개 · 가까운 날짜순`}>
        <CardGrid items={items} now={now} />
      </Section>
    </>
  );
}

function Filtered({ items, now }: { items: ActivityCardData[]; now: Date }) {
  return (
    <section aria-labelledby="explore-results">
      <div className={styles.resultHead}>
        <h2 id="explore-results" className={styles.resultCount}>
          {items.length > 0 ? `${items.length}개 찾았어요` : "조건에 맞는 활동이 없어요"}
        </h2>
        <Link href="/explore" className={styles.reset} scroll={false}>
          필터 지우기
        </Link>
      </div>
      {items.length > 0 ? (
        <CardGrid items={items} now={now} />
      ) : (
        <EmptyState
          title="조건을 조금 넓혀 보세요"
          body="기간이나 형식 필터를 하나 빼면 더 많은 활동이 보여요."
          action={{ href: "/explore", label: "전체 활동 보기" }}
        />
      )}
    </section>
  );
}

function Section({
  title,
  sub,
  more,
  children,
}: {
  title: string;
  sub?: string;
  more?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const id = `explore-${title.replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id} className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 id={id}>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {more && (
          <Link href={more.href} scroll={false}>
            {more.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function CardRow({ items, now }: { items: ActivityCardData[]; now: Date }) {
  return (
    <ul className={styles.row}>
      {items.map((a) => (
        <li key={a.id}>
          <ActivityCard activity={a} now={now} href={`/activities/${a.slug}`} />
        </li>
      ))}
    </ul>
  );
}

function CardGrid({ items, now }: { items: ActivityCardData[]; now: Date }) {
  return (
    <ul className={styles.grid}>
      {items.map((a) => (
        <li key={a.id}>
          <ActivityCard activity={a} now={now} href={`/activities/${a.slug}`} />
        </li>
      ))}
    </ul>
  );
}
