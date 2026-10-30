import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "스테이지별 지도 미리보기 · Workbook",
  robots: { index: false, follow: false },
};
const maps = [
  {
    title: "AI 도구 준비하기",
    scenery: "가을 바다 섬",
    file: "ai-beginner-five-places-v1.png",
    steps: [
      "AI 이해하기",
      "AI 종류와 도구",
      "도구 준비하기",
      "AI와 첫 대화",
      "에이전트와 바이브코딩",
    ],
  },
  {
    title: "기획하고 첫 화면 만들기",
    scenery: "호수와 절벽",
    file: "map.png",
    steps: ["기획과 자료 정하기", "제작 요청 다듬기", "첫 화면 확인하기"],
  },
  {
    title: "반응형 화면 만들기",
    scenery: "강과 정원",
    file: "experience-river-garden-v1.png",
    steps: ["두 화면에서 문제 찾기", "개선 요청 쓰기", "수정 전후 확인"],
  },
  {
    title: "기능과 데이터 저장",
    scenery: "고산과 침엽수 숲",
    file: "data-alpine-archive-v1.png",
    steps: ["입력과 화면 변화", "새로고침과 저장", "다른 기기와 서버"],
  },
  {
    title: "배포하고 고치기",
    scenery: "바닷가 항구",
    file: "publish-harbour-v1.png",
    steps: ["공개 전 점검", "주소와 배포", "공개 후 문제 해결"],
  },
];

export default function WorkbookMapsPreview() {
  return (
    <main className={styles.page}>
      <header>
        <div>
          <span className="label">WORKBOOK · MAP PREVIEW</span>
          <h1>스테이지별 지도 한눈에 보기</h1>
        </div>
        <Link href="/workbook/classes/vibe-web">클래스로 돌아가기 ↗</Link>
      </header>
      <p>현재 수업에 연결된 지도 원화 5장이에요. 그림을 누르면 크게 볼 수 있어요.</p>
      <div className={styles.grid}>
        {maps.map((map, index) => (
          <section key={map.file} className={styles.card}>
            <div className={styles.title}>
              <span>{String(index).padStart(2, "0")}</span>
              <h2>{map.title}</h2>
              <small>{map.scenery}</small>
            </div>
            <a
              href={`/images/workbook/journey/${map.file}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`${map.title} 지도 크게 보기`}
            >
              <Image
                src={`/images/workbook/journey/${map.file}`}
                alt={`${map.scenery} 배경의 ${map.title} 지도`}
                width={1536}
                height={1024}
                sizes="(min-width: 768px) 33vw, 100vw"
              />
            </a>
            <p className={styles.steps}>{map.steps.join(" → ")}</p>
          </section>
        ))}
        <section className={`${styles.card} ${styles.pending}`}>
          <span className="label">OPTIONAL · 준비 중</span>
          <h2>AI와 일하는 방식</h2>
          <p>선택 심화의 전용 지도는 아직 연결되지 않았어요.</p>
        </section>
      </div>
      <p className={styles.note}>
        지도 배경 비교용 미리보기예요. 실제 진행 포인트·캐릭터·완료 상태는 클래스에서 확인해요.
      </p>
    </main>
  );
}
