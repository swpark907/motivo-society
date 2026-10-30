import styles from "./WorkbookLessonRecap.module.scss";

// 완료 여부를 추측하지 않고, 수업에서 확인한 내용과 학습자의 기록을 구분해 보여준다.
export function WorkbookLessonRecap({
  learned,
  change,
  next,
  evidence,
  mode = "학습 정리",
}: {
  learned: string[];
  change: string;
  next: string;
  evidence?: { label: string; text: string }[];
  mode?: string;
}) {
  return (
    <section className={styles.recap} aria-label="배운 내용과 내 작업의 변화">
      <span className="label">{mode}</span>
      <h2>배운 내용과 내 작업의 변화</h2>
      <div className={styles.columns}>
        <div>
          <h3>이번에 배운 내용</h3>
          <ul>
            {learned.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>내 작업에 이어지는 변화</h3>
          <p>{change}</p>
        </div>
      </div>
      {evidence?.some((item) => item.text.trim()) && (
        <details>
          <summary>내가 남긴 기록 보기</summary>
          <dl>
            {evidence
              .filter((item) => item.text.trim())
              .map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.text}</dd>
                </div>
              ))}
          </dl>
        </details>
      )}
      <p className={styles.next}>
        <strong>다음에 할 일</strong>
        <br />
        {next}
      </p>
    </section>
  );
}
