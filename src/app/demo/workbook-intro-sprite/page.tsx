import type { Metadata } from "next";
import { WorkbookIntroSprite } from "@/components/WorkbookIntroSprite/WorkbookIntroSprite";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "인트로 카피바라 스프라이트 테스트 · Workbook",
  robots: { index: false, follow: false },
};

export default function IntroSpritePreviewPage() {
  return (
    <main className={`paper ${styles.page}`}>
      <p className={styles.label}>WORKBOOK / INTRO SPRITE STUDY</p>
      <WorkbookIntroSprite />
      <p className={styles.note}>
        서서 인사한 뒤 갑자기 나타난 책상에 놀라고, 앉아서 공부하는 장면이 이어지는 시안이에요. 공부
        동작 순서는 매번 섞여요.
      </p>
    </main>
  );
}
