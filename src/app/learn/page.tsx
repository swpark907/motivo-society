import type { Metadata } from "next";
import Link from "next/link";
import { PlatformPage } from "@/components/PlatformPage/PlatformPage";
import { getAllLibraryItems } from "@/lib/content/library";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "클래스",
  description: "워크북 클래스와 모쏘가 직접 써 보고 정리한 읽을거리.",
};

const DOORS = [
  {
    href: "/workbook",
    title: "워크북",
    body: "커리큘럼을 따라가며 직접 만들어 보는 클래스예요.",
  },
  {
    href: "/library",
    title: "라이브러리",
    body: "바로 써먹는 스킬·프롬프트·사용법을 모았어요.",
  },
  {
    href: "/article",
    title: "아티클",
    body: "모쏘가 직접 써 보고 겪은 이야기를 글로 남겨요.",
  },
] as const;

export default async function LearnPage() {
  // 라이브러리에 글이 아직 없으면 "모았어요"라고 말하지 않는다(정직함).
  const libraryCount = (await getAllLibraryItems()).length;
  const doors = DOORS.map((d) =>
    d.href === "/library" && libraryCount === 0
      ? { ...d, body: "스킬·프롬프트·사용법을 모으고 있어요. 첫 글을 준비 중이에요." }
      : d,
  );
  return (
    <PlatformPage
      label="CLASSES"
      title="클래스"
      lead="혼자 따라가는 클래스와, 필요할 때 꺼내 보는 읽을거리예요."
    >
      <ul className={styles.doors}>
        {doors.map((d) => (
          <li key={d.href}>
            <Link href={d.href} className={styles.door}>
              <span className={styles.doorTitle}>{d.title}</span>
              <span className={styles.doorBody}>{d.body}</span>
              <span className={styles.doorGo} aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PlatformPage>
  );
}
