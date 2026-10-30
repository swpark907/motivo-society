import Image from "next/image";
import { workbookTrial } from "@/lib/workbook-course";
import { WorkbookReviewExcerpt } from "./WorkbookReviewExcerpt";
import styles from "./WorkbookFeaturedClass.module.scss";

const outcomes = [
  [
    "만들고 싶은 내용을 AI에게 설명하기",
    "누구에게 보여줄 페이지인지, 어떤 내용이 들어가야 하는지 정리해요. 원하는 화면을 AI가 이해할 수 있도록 구체적으로 요청하는 연습을 해요.",
  ],
  [
    "내 컴퓨터에서 웹페이지 만들고 열어보기",
    "AI 도구를 준비하고, 요청에 따라 만들어진 파일을 작업 폴더에서 확인해요. 그 파일을 브라우저로 열어 내가 만든 웹페이지를 살펴봐요.",
  ],
  [
    "화면을 확인하고 수정 요청하기",
    "PC와 모바일에서 글과 사진이 어떻게 보이는지 비교해요. 고칠 부분을 AI에게 설명하고, 수정 후에는 내용이 잘 읽히고 버튼이 동작하는지 직접 확인해요.",
  ],
  [
    "다른 페이지를 만들 때도 같은 방법 활용하기",
    "요청 → 파일 변경 → 실행과 확인 → 수정 요청의 순서를 익혀요. 이번에 만든 페이지를 나중에 고치거나, 다른 주제로 새 페이지를 만들 때도 활용할 수 있어요.",
  ],
];
const audiences = [
  [
    "AI가 처음이라 무엇부터 해야 할지 모르겠어요",
    "AI가 무엇을 할 수 있고 어디서 실수하는지부터 알아봐요. 처음 듣는 용어를 함께 살펴보고, 도구를 준비해 첫 요청을 보내봐요.",
  ],
  [
    "만들고 싶은 페이지는 있는데 코딩 경험이 없어요",
    "자기소개, 작업 모음, 추천 목록 중 내게 필요한 페이지를 생각해봐요. 보여줄 내용과 순서를 정한 뒤, AI와 함께 초안을 만들고 수정해요.",
  ],
  [
    "AI가 만든 결과를 어떻게 고칠지 막막해요",
    "첫 결과가 마음에 들지 않을 때 무엇을 확인하고 어떻게 다시 요청할지 배워요. 화면 비교와 수정 요청 예시로 연습한 뒤 내 페이지에도 적용해봐요.",
  ],
];
const exampleReviews = [
  [
    "AI가 처음인 입문자",
    "도구 이름부터 낯설었는데, 설명을 읽고 작은 예시를 직접 바꿔보는 순서라 시작하는 장면을 상상하기 좋았어요. 첫 파일을 열어보는 순간이 가장 기억에 남을 것 같아요. 특히 AI에게 어떤 내용을 요청하고, 나온 화면에서 무엇을 확인해야 하는지 예시가 있어 도움이 될 것 같아요. 제 소개 페이지를 만들면서 사진과 글의 배치도 하나씩 바꿔보고 싶어요.",
  ],
  [
    "작업 소개를 만들고 싶은 사람",
    "무엇을 만들지 정리하는 부분이 마음에 들어요. 화면부터 꾸미기 전에 누구에게 어떤 작업을 보여줄지 생각해보는 구성이 도움이 될 것 같아요.",
  ],
  [
    "AI로 제작을 시도해본 사람",
    "처음 나온 결과에서 끝내지 않고, 화면을 비교하고 수정할 곳을 짚는 과정이 좋아요. 다음에는 어떤 요청을 하면 될지 연습해볼 수 있겠어요.",
  ],
];

export function WorkbookFeaturedClass() {
  return (
    <section
      id="featured-class"
      className={`${styles.feature} ${styles.introduction}`}
      aria-labelledby="featured-class-title"
    >
      <header className={styles.coverCopy}>
        <span className="label">ABOUT THIS CLASS</span>
        <h2 id="featured-class-title">
          AI에게 요청하고,
          <br />
          직접 웹페이지를 만들어봐요.
        </h2>
      </header>
      <div className={styles.content}>
        <p className={styles.lead}>
          내 소개, 작업 모음, 추천 목록 중 만들고 싶은 주제를 골라요. AI에게{" "}
          <strong>필요한 내용을 요청하고, 만들어진 화면을 확인하고, 수정하는 방법</strong>을 배워요.
          AI 도구가 처음이라면 기본 개념과 설치부터 시작할 수 있어요.
        </p>
        <section className={styles.block} aria-labelledby="featured-outcomes-title">
          <span className="label">WHAT YOU TAKE AWAY</span>
          <h3 id="featured-outcomes-title">이 클래스에서 배우는 것</h3>
          <div className={styles.outcomes}>
            {outcomes.map(([title, description], index) => (
              <div key={title}>
                <span className={styles.number}>0{index + 1}</span>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
        <section
          className={`${styles.block} ${styles.journey}`}
          aria-labelledby="class-journey-title"
        >
          <span className="label">ONE PROJECT, STEP BY STEP</span>
          <h3 id="class-journey-title">
            기획부터 수정까지,
            <br />
            같은 페이지를 발전시켜요.
          </h3>
          <p>
            한 폴더에서 만든 파일을 다음 단원에서도 이어서 사용해요. 작업 소개 페이지를 만든다면
            다음과 같은 순서로 진행할 수 있어요.
          </p>
          <figure className={styles.diagramImage}>
            <Image
              src="/images/workbook/class-project-journey-v1.png"
              alt="같은 포트폴리오가 내용 정하기, 초안 만들기, PC·모바일 화면 개선, 선택적인 상세 보기 추가, 공개와 수정으로 발전하는 과정 예시"
              width={1983}
              height={793}
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
            <figcaption>작업 소개 페이지로 살펴보는 제작 과정 예시</figcaption>
          </figure>
          <ol className={styles.journeySummary}>
            <li>
              <strong>01 · 내용 정하기</strong>
              <span>누구에게 어떤 작업을 보여줄지 정해요.</span>
            </li>
            <li>
              <strong>02 · 초안 만들기</strong>
              <span>자기소개와 작업 목록을 넣어요.</span>
            </li>
            <li>
              <strong>03 · 화면 개선</strong>
              <span>PC와 모바일에서 읽기 좋게 다듬어요.</span>
            </li>
            <li>
              <strong>04 · 동작 연습</strong>
              <span>메모로 원리를 배우고, 상세 보기와 저장은 선택해서 연습해요.</span>
            </li>
            <li>
              <strong>05 · 공개와 수정</strong>
              <span>공개 전 점검과 수정 후 다시 확인하는 방법을 배워요.</span>
            </li>
          </ol>
          <p className={styles.note}>
            과정을 설명하는 예시예요. 상세 보기와 저장은 필요할 때 선택해서 연습해요. 실제 배포의
            기본 서비스와 이용 조건은 검토 중입니다.
          </p>
        </section>
        <section
          className={`${styles.block} ${styles.method}`}
          aria-labelledby="featured-method-title"
        >
          <span className="label">TWO SPACES, ONE LEARNING EXPERIENCE</span>
          <h3 id="featured-method-title">
            워크북에서 이해하고,
            <br />내 컴퓨터에서 만들어봐요.
          </h3>
          <figure className={styles.diagramImage}>
            <Image
              src="/images/workbook/class-learning-flow-v2.png"
              alt="워크북에서 설명과 화면 비교로 연습한 뒤, 외부 AI 도구에서 파일을 만들고 브라우저로 확인하고 다음 수업으로 돌아오는 흐름 예시"
              width={1672}
              height={941}
              sizes="(min-width: 1024px) 60vw, 100vw"
            />
            <figcaption>학습 방식 설명을 위해 만든 가상 화면입니다.</figcaption>
          </figure>
          <div className={styles.learningSpaces}>
            <div className={styles.workbookSpace}>
              <span className={styles.spaceTag}>01 / 워크북</span>
              <h4>설명을 읽고 화면 예시로 연습하기</h4>
              <p>
                설명을 읽고 확인 문제를 풀어요. PC·모바일 화면을 비교하고 메모를 입력해보며, 화면
                배치와 저장 기능이 어떻게 작동하는지 배워요.
              </p>
            </div>
            <div className={styles.computerSpace}>
              <span className={styles.spaceTag}>02 / 개인 컴퓨터 + 외부 AI 도구</span>
              <h4>AI에게 요청해 내 파일 만들기</h4>
              <p>
                수업의 요청 예시를 내 내용에 맞게 바꿔 AI에게 전달해요. 실제 파일을 열고 결과를
                확인한 다음, 워크북으로 돌아와 다음 수업을 진행해요.
              </p>
            </div>
          </div>
          <p className={styles.note}>
            위 그림은 학습 방식을 설명하는 도식입니다. 워크북의 예시 조작이 내 컴퓨터의 파일을
            자동으로 바꾸지는 않아요.
          </p>
        </section>
        <section
          className={`${styles.block} ${styles.caseStudy}`}
          aria-labelledby="class-case-title"
        >
          <span className="label">A SMALL REQUEST, A CLEARER PAGE</span>
          <h3 id="class-case-title">
            마음에 들지 않는 화면,
            <br />
            어떻게 고쳐달라고 할까요?
          </h3>
          <p>
            “더 예쁘게 해줘”라고만 하기보다, 어디가 불편한지와 어떻게 바꾸고 싶은지를 말해봐요.
            아래는 작업 소개 페이지를 수정하는 요청 예시예요.
          </p>
          <ol className={styles.requestSteps}>
            <li>
              <span>01 / 처음 요청</span>
              <p>“내 작업 세 개를 소개하는 한 페이지를 만들어줘. 자기소개와 연락 방법도 넣어줘.”</p>
            </li>
            <li>
              <span>02 / 결과 관찰</span>
              <p>
                “휴대폰에서는 첫 사진이 화면을 가득 채워서 작업 제목을 보기까지 오래 내려야 하네.”
              </p>
            </li>
            <li>
              <span>03 / 수정 요청</span>
              <p>“모바일에서 첫 사진 높이를 줄여줘. 작업 제목과 짧은 설명이 먼저 보이게 해줘.”</p>
            </li>
          </ol>
          <div className={styles.checkBack}>
            <strong>수정한 뒤에는 PC와 모바일에서 다시 확인해요.</strong>
            <p>
              모바일에서 제목이 잘 보이는지 확인해요. PC 화면이나 다른 작업의 내용에 문제가 생기지
              않았는지도 살펴봐요.
            </p>
          </div>
          <p className={styles.note}>
            학습 흐름을 설명하기 위한 가상 제작 사례입니다. AI의 결과는 요청과 사용 도구에 따라
            달라질 수 있어요.
          </p>
        </section>
        <section className={styles.block} aria-labelledby="featured-audience-title">
          <span className="label">IS THIS FOR YOU?</span>
          <h3 id="featured-audience-title">이런 분께 추천해요</h3>
          <div className={styles.audiences}>
            {audiences.map(([title, description]) => (
              <div key={title}>
                <h4>“{title}”</h4>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <p className={styles.note}>
            수업을 보며 내 컴퓨터에서 직접 제작하는 과정이에요. AI에게 요청하고 결과를 확인할 실습
            시간을 마련해주세요.
          </p>
        </section>
      </div>
    </section>
  );
}

export function WorkbookClassExampleReviews() {
  return (
    <div className={styles.feature}>
      <div className={styles.content}>
        <section
          id="class-reviews"
          className={styles.reviews}
          aria-labelledby="featured-reviews-title"
        >
          <span className="label">REVIEW PREVIEW · 가상 후기 예시</span>
          <h3 id="featured-reviews-title">수강평 예시</h3>
          <p className={styles.note}>
            아래는 후기 영역의 구성을 보여주기 위해 만든 가상 내용입니다. 실제 수강생의 후기가
            아니며, 인물 유형도 예시예요.
          </p>
          <div className={styles.reviewGrid}>
            {exampleReviews.map(([person, quote], index) => (
              <WorkbookReviewExcerpt
                key={person}
                person={person}
                quote={quote}
                index={index}
                rating={[5, 4, 5][index]}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const faqs = [
  [
    "코드를 전혀 몰라도 시작할 수 있나요?",
    "AI와 웹개발을 처음 접하는 분을 기준으로 구성했어요. AI의 역할과 한계, 도구 준비부터 시작합니다. 실습에서는 직접 AI에게 요청하고 만들어진 파일을 열어 확인해요.",
  ],
  [
    "만들 주제를 아직 정하지 못했어요.",
    "서비스 소개, 작업 모음, 취향 모음 같은 작은 소재에서 출발할 수 있어요. 기획 단계에서 누구에게 무엇을 보여줄지 정리해요. 처음부터 큰 아이디어가 없어도 괜찮아요.",
  ],
  [
    "AI가 원하는 대로 만들지 않으면 어떻게 하나요?",
    "나온 결과를 관찰하고 바꿀 곳을 구체적으로 짚는 연습을 해요. 질문과 수정 요청 예시를 참고하고, 실제 파일이 바뀌었는지 확인하는 과정을 반복합니다.",
  ],
  [
    "휴대폰만으로도 들을 수 있나요?",
    "모바일에서는 설명을 읽고 예시를 복습할 수 있어요. 실제 파일을 만드는 제작 실습은 Windows 또는 Mac 개인 컴퓨터와 외부 AI 도구가 필요합니다.",
  ],
  [
    "AI 도구 비용과 클래스 이용 조건은 어떻게 되나요?",
    `${workbookTrial.scope} 가입·결제 없이 시작할 수 있어요. 외부 AI 도구의 무료 이용 범위와 유료 조건은 도구마다 달라 준비 수업에서 확인해요. ${workbookTrial.publishing}`,
  ],
  ["학습 기록은 저장되나요?", `${workbookTrial.records} ${workbookTrial.browserRecords}`],
];
export function WorkbookClassFaq() {
  return (
    <section className={`${styles.feature} ${styles.faq}`} aria-labelledby="class-faq-title">
      <span className="label">BEFORE YOUR FIRST STEP</span>
      <h2 id="class-faq-title">자주 묻는 질문</h2>
      {faqs.map(([question, answer]) => (
        <details key={question}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </section>
  );
}
