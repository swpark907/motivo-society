"use client";

// 이 브라우저의 실제 실험 기록만 이어하기에 사용한다. 구매 권한을 뜻하지 않는다.
import Image from "next/image";
import Link from "next/link";
import { useJourneyProgress } from "@/components/WorkbookJourney/useJourneyProgress";
import styles from "./WorkbookHome.module.scss";

const previews = [
  {
    title: "AI와 만드는 작은 브랜드",
    category: "DESIGN & IDENTITY",
    description: "취향을 모으고, 나의 브랜드를 구체적인 모습으로.",
    image: "/images/workbook/study-v3.png",
  },
  {
    title: "AI와 쓰는 나의 첫 글",
    category: "WORDS & STORIES",
    description: "흩어진 생각에서 시작해, 내 목소리가 담긴 한 편으로.",
    image: "/images/workbook/vibe-web-cover-v1.png",
  },
];

export function WorkbookHome() {
  const { progress, ready, storageError } = useJourneyProgress();
  const started = ready && progress.completed > 0;
  return (
    <main className={styles.home}>
      <section className={styles.hero} aria-labelledby="workbook-title">
        <Image
          src="/images/workbook/study-v3.png"
          alt="차를 들고 작업하는 카피바라의 따뜻한 작업실"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroCopy}>
          <span className="label">YOUR LITTLE CREATIVE CLUB</span>
          <h1 id="workbook-title">
            작은 시도부터,
            <br />내 것으로.
          </h1>
          <p>
            배우고 싶은 날도, 잠깐 쉬어가는 날도.
            <br />
            오늘의 호기심을 펼쳐보세요.
          </p>
          <a className={styles.cta} href="#classes">
            클래스 둘러보기 ↗
          </a>
        </div>
      </section>
      <div className={styles.body}>
        {started && (
          <section className={styles.resume} aria-label="실험 이어하기">
            <div>
              <span className="label">WELCOME BACK · 체험 기록</span>
              <h2>지난번 발견에서 이어가요.</h2>
              <p>모바일 소개 페이지 실험 · {progress.completed} / 3 장소 완료</p>
            </div>
            <Link className={styles.cta} href="/workbook/journey">
              여정 이어가기 ↗
            </Link>
          </section>
        )}
        <nav className={styles.shortcuts} aria-label="홈 콘텐츠">
          <a href="#classes">클래스</a>
          <a href="#experiments">짧은 실험</a>
          <a href="#reading">읽을거리</a>
          <a href="#notes">내 기록</a>
        </nav>
        <section id="classes" className={styles.section}>
          <header className={styles.heading}>
            <div>
              <span className="label">LEARN BY MAKING</span>
              <h2>만들면서 익히는 클래스</h2>
            </div>
            <span>나의 속도로, 하나씩</span>
          </header>
          <p className={styles.intro}>
            클래스별로 선택하는 배움. 현재는 홈 구성 시안이며, 체험 가능한 클래스와 기획 예시를 함께
            보여드려요.
          </p>
          <div className={styles.cards}>
            <Link href="/workbook/classes/vibe-web" className={styles.card}>
              <Image
                src="/images/workbook/vibe-web-cover-v1.png"
                alt="모니터 속 작은 픽셀 마을을 바라보는 실사 카피바라"
                width={1672}
                height={941}
                sizes="(min-width: 1024px) 28vw, 100vw"
              />
              <div>
                <span className={styles.tag}>CLASS 01 · 프로토타입 체험</span>
                <h3>바이브코딩 웹개발 클래스</h3>
                <p>아이디어를 첫 화면으로, 카피바라와 함께하는 웹 제작 여행.</p>
                <small>입문 · 4개 월드 + 선택 심화</small>
                <strong>클래스 알아보기 ↗</strong>
              </div>
            </Link>
            {previews.map((item) => (
              <article className={styles.card} key={item.title}>
                <Image
                  src={item.image}
                  alt=""
                  width={1672}
                  height={941}
                  sizes="(min-width: 1024px) 28vw, 100vw"
                />
                <div>
                  <span className={styles.tag}>기획 예시 · 판매하지 않아요</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <small>{item.category}</small>
                  <span className={styles.pending}>다음 배움의 가능성</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="experiments" className={styles.section}>
          <header className={styles.heading}>
            <div>
              <span className="label">A LITTLE PLAY</span>
              <h2>잠깐, 손으로 생각하기</h2>
            </div>
            <span>가볍게 들어와도 좋아요</span>
          </header>
          <div className={styles.experiments}>
            <Link href="/demo/workbook-desk" className={styles.experiment}>
              <span className={styles.number}>01</span>
              <div>
                <small>배치 실험 · 데모</small>
                <h3>카피바라의 책상 정리</h3>
                <p>방향과 간격을 바꾸며 배치 규칙을 발견해요.</p>
              </div>
              <span>↗</span>
            </Link>
            <Link
              href="/workbook/journey"
              className={styles.experiment}
              aria-label="기존 모바일 실험 보기"
            >
              <span className={styles.number}>02</span>
              <div>
                <small>화면 실험 · 데모</small>
                <h3>휴대폰에서는 왜 잘릴까?</h3>
                <p>좁은 화면과 넓은 화면을 오가며 직접 고쳐봐요.</p>
              </div>
              <span>↗</span>
            </Link>
          </div>
        </section>
        <div className={styles.lower}>
          <section id="reading" className={styles.section}>
            <header className={styles.heading}>
              <div>
                <span className="label">READ & TAKE AWAY</span>
                <h2>생각을 넓히는 이야기</h2>
              </div>
              <Link href="/article">아티클 둘러보기 ↗</Link>
            </header>
            <Link className={styles.reading} href="/article/hello-motivo-society">
              <small>아티클</small>
              <h3>모티보 소사이어티의 시작</h3>
              <p>배우고, 만들고, 발견하는 공간을 소개합니다.</p>
            </Link>
            <article className={styles.reading}>
              <small>칼럼 구성 예시 · 미발행</small>
              <h3>AI의 완료 메시지 뒤에 확인할 것</h3>
              <p>만들었다는 말과 직접 써본 결과 사이에서.</p>
            </article>
            <article className={styles.reading}>
              <small>칼럼 구성 예시 · 미발행</small>
              <h3>만들기 전에 정해두면 좋은 세 가지</h3>
              <p>누구를 위해, 무엇을, 어디까지 만들까요?</p>
            </article>
          </section>
          <aside id="notes" className={styles.journal} aria-label="내 발견 기록">
            <span className="label">MY LITTLE NOTES</span>
            <h2>오늘의 발견 한 조각</h2>
            <p>
              {progress.note ||
                "손으로 바꿔보고 알게 된 것을 남겨보세요. 작은 발견이 다음 작업의 힌트가 돼요."}
            </p>
            {progress.applied && <p>내 프로젝트에 적용하고 확인했다고 표시했어요.</p>}
            <Link href="/workbook/journey">실험에서 기록 남기기 ↗</Link>
            <small>
              {storageError
                ? "저장소에 접근할 수 없어요. 기록을 복사해 보관해주세요."
                : "실험 기록은 이 브라우저에만 저장돼요. 구매 내역과는 별개예요."}
            </small>
          </aside>
        </div>
      </div>
    </main>
  );
}
