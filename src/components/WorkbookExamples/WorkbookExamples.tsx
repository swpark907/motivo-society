import Image from "next/image";
import Link from "next/link";
import { getWorkbookPurpose } from "@/lib/workbook-purpose";
import styles from "./WorkbookExamples.module.scss";

const examples = [
  {
    id: "service",
    label: "서비스 소개",
    title: "내 아이디어를 소개하는 페이지",
    description: "누구를 돕고, 무엇을 제공하는지 한 화면으로 정리해요.",
    preparation: "소개할 아이디어 · 제공할 내용 · 연락 방법",
  },
  {
    id: "portfolio",
    label: "포트폴리오",
    title: "내 작업을 보여주는 페이지",
    description: "내가 한 일과 그 과정이 드러나도록 작업을 모아요.",
    preparation: "자기소개 · 보여줄 작업 · 직접 맡은 일",
  },
  {
    id: "personal",
    label: "개인 사이트",
    title: "좋아하는 것을 담은 페이지",
    description: "취향이나 작은 아이디어를 나만의 웹페이지에 담아요.",
    preparation: "좋아하는 주제 · 소개 문장 · 넣고 싶은 내용",
  },
];

// 생성한 웹사이트 디자인 예시이며 실제 수강 결과나 동작하는 사이트는 아니다.
export function WorkbookExamples({
  compact = false,
  legacy = false,
}: {
  compact?: boolean;
  legacy?: boolean;
}) {
  return (
    <div className={styles.examples}>
      {examples.map((example) => (
        <article key={example.id} id={`example-${example.id}`} className={styles.example}>
          {legacy ? (
            <div
              className={styles.pagePreview}
              data-purpose={example.id}
              aria-label={`${example.label} 웹페이지 구성 예시`}
            >
              <div className={styles.browserBar}>
                <span className={styles.windowMarks} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>{example.label}</span>
                <span>구성 예시</span>
              </div>
              <div className={styles.previewBody}>
                <div className={styles.previewHeading}>
                  <span className={styles.category}>
                    {example.id === "service"
                      ? "A SMALL BUSINESS, A FIRST PAGE."
                      : example.id === "portfolio"
                        ? "SELECTED WORK & PROCESS"
                        : "A COLLECTION OF LITTLE THINGS"}
                  </span>
                  <h3>{getWorkbookPurpose(example.id).fields.title}</h3>
                  <p>{getWorkbookPurpose(example.id).fields.intro}</p>
                </div>
                <div className={styles.artwork} aria-hidden="true">
                  {example.id === "service" ? (
                    <>
                      <div className={styles.servicePoster}>
                        <span>
                          우리 가게의
                          <br />
                          이야기를
                          <br />한 페이지에.
                        </span>
                        <small>MENU / STORY / CONTACT</small>
                      </div>
                      <div className={styles.serviceSections}>
                        <span>
                          01 <b>가게 소개</b>
                          <i>↗</i>
                        </span>
                        <span>
                          02 <b>메뉴와 이야기</b>
                          <i>↗</i>
                        </span>
                        <span>
                          03 <b>연락 방법</b>
                          <i>↗</i>
                        </span>
                      </div>
                    </>
                  ) : example.id === "portfolio" ? (
                    <>
                      <div className={styles.projectPoster}>
                        <span>01 / WEB</span>
                        <strong>
                          MAKE.
                          <br />
                          REFINE.
                        </strong>
                        <small>만들고, 확인하고, 고친 과정.</small>
                      </div>
                      <div className={styles.projectNotes}>
                        <span>PROJECT NOTES</span>
                        <p>무엇을 만들었나요?</p>
                        <b>문제 → 과정 → 결과</b>
                        <div>
                          <i />
                          <i />
                          <i />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.personalNote}>
                        <span>MY LITTLE ARCHIVE</span>
                        <strong>
                          좋아서
                          <br />
                          모아둔 것들.
                        </strong>
                        <small>나의 시선으로 발견한 이야기.</small>
                      </div>
                      <div className={styles.personalTiles}>
                        <div>
                          <span>01</span>
                          <b>좋아하는 것</b>
                        </div>
                        <div>
                          <span>02</span>
                          <b>기록한 순간</b>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.previewFoot}>
                  <span>
                    {example.id === "service"
                      ? "소개 → 제공할 내용 → 문의"
                      : example.id === "portfolio"
                        ? "자기소개 → 작업 → 맡은 역할"
                        : "주제 → 좋아하는 이유 → 기록"}
                  </span>
                  <span aria-hidden="true">↗</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.thumbnail}>
              <Image
                src={`/images/workbook/candidates/${example.id}-website-v2.png`}
                alt={
                  example.id === "service"
                    ? "서비스 소개 웹사이트 디자인 예시: 큰 제목과 내용 보기 버튼 옆에 가게 사진을 배치한 화면"
                    : example.id === "portfolio"
                      ? "포트폴리오 웹사이트 디자인 예시: 검정 바탕에 크기가 다른 세 작업을 배열한 화면"
                      : "개인 사이트 디자인 예시: 골목 사진과 짧은 발견 기록을 나눈 편집형 화면"
                }
                width={1672}
                height={941}
                sizes="(min-width: 1280px) min(33vw, 480px), (min-width: 768px) 50vw, 100vw"
              />
            </div>
          )}
          <div className={styles.caption}>
            <span className="label">{example.label} · 구성 예시</span>
            <h3>{example.title}</h3>
            <p>{example.description}</p>
            {compact ? (
              <Link href={`/workbook/classes/vibe-web#example-${example.id}`}>
                클래스에서 살펴보기 →
              </Link>
            ) : (
              <small>준비할 내용: {example.preparation}</small>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
