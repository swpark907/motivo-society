import Image from "next/image";
import Link from "next/link";
import type { WorkbookReadingSummary } from "@/lib/content/workbook-readings";
import styles from "./WorkbookHomeContentPreview.module.scss";

const situations = [
  {
    title: "생각한 것과 다르게 나왔나요?",
    description: "원하는 결과를 설명하고, 바꿀 곳을 함께 짚어봐요.",
    slugs: ["describe-the-result", "show-the-screen"],
  },
  {
    title: "만들다가 멈췄나요?",
    description: "막힌 상황을 전달하고, 다음 작업으로 이어가요.",
    slugs: ["report-the-error", "leave-a-handoff"],
  },
  {
    title: "이대로 써도 괜찮을까요?",
    description: "근거와 예상 밖의 상황을 한 번 더 확인해봐요.",
    slugs: ["check-the-source", "test-the-awkward-cases"],
  },
];

/** 홈 구성 논의용 시안. 정식 홈과 발행 콘텐츠를 변경하지 않는다. */
export function WorkbookHomeContentPreview({ readings }: { readings: WorkbookReadingSummary[] }) {
  return (
    <div className={styles.content}>
      <section className={styles.story} aria-labelledby="home-story-heading">
        <div className={styles.storyCopy}>
          <span className={styles.label}>MAKING NOTES · 제작기 구성 시안</span>
          <h2 id="home-story-heading">
            첫 화면이 나온 다음,
            <br />
            무엇을 고쳤을까?
          </h2>
          <p>멋진 결과 한 장보다, 만들면서 내린 선택을 들여다보는 이야기.</p>
          <span className={styles.status}>취재·실제 제작 자료 준비 중</span>
        </div>
        <ol className={styles.storySteps} aria-label="제작기에 담을 내용">
          <li>
            <span>01</span>
            <div>
              <h3>무엇을 만들기로 했는지</h3>
              <p>목적과 독자, 처음 만들 범위를 함께 봅니다.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>첫 화면에서 발견한 것</h3>
              <p>초기 화면과 수정한 화면을 나란히 봅니다.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>다시 만든다면 바꿀 것</h3>
              <p>잘된 선택뿐 아니라 막혔던 부분도 남깁니다.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={styles.classEntry} aria-labelledby="home-class-heading">
        <div>
          <span className={styles.label}>CLASS</span>
          <h2 id="home-class-heading">처음부터 함께 만들어보고 싶다면</h2>
          <p>AI 도구 준비하기부터 내 홈페이지의 첫 제작까지, 클래스에서 이어가요.</p>
        </div>
        <Link href="/workbook/classes/vibe-web">
          웹페이지 클래스 살펴보기 <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <section className={styles.readings} aria-labelledby="home-reading-heading">
        <header>
          <div>
            <span className={styles.label}>READ WHEN YOU NEED</span>
            <h2 id="home-reading-heading">지금 필요한 글</h2>
          </div>
          <p>
            내가 겪는 상황에서 찾아보세요.
            <br />
            기존 여섯 편을 묶은 테스트 구성입니다.
          </p>
        </header>
        <div className={styles.groups}>
          {situations.map((situation, index) => (
            <section
              className={styles.group}
              key={situation.title}
              aria-labelledby={`situation-${index}`}
            >
              <div className={styles.groupHeading}>
                <span className={styles.number}>0{index + 1}</span>
                <h3 id={`situation-${index}`}>{situation.title}</h3>
                <p>{situation.description}</p>
              </div>
              <div className={styles.articleList}>
                {situation.slugs.map((slug) => {
                  const entry = readings.find((reading) => reading.slug === slug);
                  if (!entry) return null;
                  return (
                    <Link
                      className={styles.article}
                      href={`/workbook/reading/${entry.slug}`}
                      key={entry.slug}
                    >
                      <span className={styles.thumbnail}>
                        <Image
                          src={entry.thumbnail}
                          alt={entry.thumbnailAlt}
                          width={1672}
                          height={941}
                          sizes="(min-width: 768px) 144px, 96px"
                        />
                      </span>
                      <span className={styles.articleCopy}>
                        <span className={styles.tags}>{entry.tags.join(" · ")}</span>
                        <strong>{entry.title}</strong>
                        <span>{entry.summary}</span>
                      </span>
                      <span className={styles.arrow} aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
