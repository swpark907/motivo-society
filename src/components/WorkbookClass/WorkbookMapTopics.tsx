import {
  workbookCurriculum,
  workbookCurriculumStages,
  workbookPointTopics,
} from "@/lib/workbook-curriculum";
import type { PracticalStage } from "@/lib/workbook-practical-labs";
import styles from "./WorkbookMapPanel.module.scss";

export function WorkbookMapTopics({ stage, point }: { stage: PracticalStage; point: number }) {
  const unit = workbookCurriculumStages.indexOf(stage);
  const topics = workbookPointTopics[stage][point];
  if (!topics) return null;
  return (
    // 이 수업에서 배울 내용은 접지 않고 카드 안에서 바로 보여준다.
    <ul className={styles.topicList} aria-label="수업에서 배울 내용">
      {topics.map((index) => {
        const [title, ...description] = workbookCurriculum[unit].lessons[index].split(" · ");
        return (
          <li key={index}>
            <strong>{title}</strong>
            {description.length > 0 && <span>{description.join(" · ")}</span>}
          </li>
        );
      })}
    </ul>
  );
}
