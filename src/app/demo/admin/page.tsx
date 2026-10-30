import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.scss";
export default function AdminLabPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className={styles.page}>
      <span className="label">ADMIN WORKSPACE · DESIGN LAB</span>
      <h1>
        운영의 구조부터,
        <br />한 편의 편집까지.
      </h1>
      <p>콘텐츠와 편집 데이터는 함께 관리하고, 공개 화면과 미리보기는 같은 렌더러를 사용합니다.</p>
      <p className={styles.scope}>
        개발용 실험실입니다. 로그인·서버 저장·발행 기능은 연결하지 않았습니다.
      </p>
      <Link className={styles.cta} href="/demo/admin/articles">
        샘플 글로 편집기 시험하기 ↗
      </Link>
      <section>
        <h2>기능을 나누는 기준</h2>
        <div>
          {[
            [
              "콘텐츠",
              "아티클·라이브러리는 목록과 검토 흐름을 공유하되 유형별 메타데이터를 유지합니다.",
            ],
            ["편집", "문구·사진·블록 배치는 문서 데이터로 저장하고 공통 렌더러로 확인합니다."],
            ["운영", "작성 중인 개정본과 공개 중인 개정본, 검토·발행 권한을 분리합니다."],
          ].map(([title, copy]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
