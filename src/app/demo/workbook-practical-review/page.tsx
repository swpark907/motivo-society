import system from "@/components/WorkbookClass/WorkbookLesson.module.scss";
import type { Metadata } from "next";
import { WorkbookProgressProvider } from "@/components/WorkbookClass/WorkbookProgressContext";
import { WorkbookPracticalLab } from "@/components/WorkbookClass/WorkbookPracticalLab";
import type { PracticalStage } from "@/lib/workbook-practical-labs";

export const metadata: Metadata = {
  title: "실전 심화 검토 · Workbook",
  robots: { index: false, follow: false },
};
export default function PracticalReview() {
  const stages: PracticalStage[] = ["agent", "project", "experience", "data", "publish"];
  return (
    <main
      className={`paper ${system.lesson}`}
      style={{
        maxWidth: "52rem",
        margin: "auto",
        padding: "var(--space-4)",
        display: "block",
        height: "auto",
        overflow: "visible",
      }}
    >
      <h1>실전 심화 검토</h1>
      <p>
        수업 안의 선택 활동을 모은 검토 화면이에요. 실제 학습 완료·외부 파일 작업은 기록하지 않아요.
      </p>
      <div className={system.lessonBody}>
        <WorkbookProgressProvider>
          {stages.map((stage) => (
            <WorkbookPracticalLab key={stage} stage={stage} />
          ))}
        </WorkbookProgressProvider>
      </div>
    </main>
  );
}
