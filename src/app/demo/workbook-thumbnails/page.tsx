import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { WorkbookExamples } from "@/components/WorkbookExamples/WorkbookExamples";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "목적별 이미지 후보 · Workbook",
  robots: { index: false, follow: false },
};
const candidates = [
  {
    id: "service",
    label: "서비스 소개",
    title: "내 아이디어를 소개하는 페이지",
    description: "누구를 돕고, 무엇을 제공하는지 한 화면으로 정리해요.",
    scene: "서비스 소개 웹페이지 예시 · 큰 제목과 내용 보기 버튼, 가게 사진을 담은 랜딩 화면",
  },
  {
    id: "portfolio",
    label: "포트폴리오",
    title: "내 작업을 보여주는 페이지",
    description: "내가 한 일과 그 과정이 드러나도록 작업을 모아요.",
    scene: "포트폴리오 웹페이지 예시 · 서로 다른 크기의 작업 이미지와 프로젝트 목록",
  },
  {
    id: "personal",
    label: "개인 사이트",
    title: "좋아하는 것을 담은 페이지",
    description: "취향이나 작은 아이디어를 나만의 웹페이지에 담아요.",
    scene: "개인 기록 웹페이지 예시 · 골목 사진과 짧은 기록을 배열한 편집형 화면",
  },
];
export default function WorkbookThumbnailCandidates() {
  return (
    <main className={styles.page}>
      <span className="label">WORKBOOK · IMAGE CANDIDATES</span>
      <h1>첫 페이지, 서로 다른 세 가지 시작</h1>
      <p>
        같은 클래스의 목적별 웹사이트 디자인 후보예요. AI로 만든 구성 예시이며 실제 수강 결과나
        동작하는 웹사이트 화면은 아니에요.
      </p>
      <p>
        기존 홈·클래스 이미지는 유지했습니다. 사진보다 웹페이지의 구성과 개성을 먼저 볼 수 있도록
        후보를 바꿨어요.
      </p>
      <div className={styles.grid}>
        {candidates.map((item) => (
          <article key={item.id}>
            <div className={styles.visual}>
              <Image
                src={`/images/workbook/candidates/${item.id}-website-v2.png`}
                alt={item.scene}
                width={1536}
                height={864}
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 100vw"
              />
            </div>
            <span className="label">{item.label} · 구성 예시</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <Link href={`/workbook/classes/vibe-web#example-${item.id}`}>
              클래스에서 살펴보기 →
            </Link>
          </article>
        ))}
      </div>
      <section className={styles.original}>
        <h2>현재 적용된 구성과 비교</h2>
        <WorkbookExamples compact legacy />
      </section>
    </main>
  );
}
