import { WorkbookTip } from "./WorkbookTip";
import { getWorkbookPurposeStages } from "@/lib/workbook-purpose";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";

export function WorkbookPurposeStage({ stage }: { stage: "data" | "publish" }) {
  const { purpose } = useWorkbookProgress();
  const guidance = getWorkbookPurposeStages(purpose);
  return (
    <section
      className={styles.pageReview}
      aria-label={
        stage === "data" ? "내 목적에 필요한 기능과 데이터" : "내 목적의 공개 전 확인 기준"
      }
    >
      <span className="label">
        {stage === "data" ? "MY PAGE · BEHAVIOR & DATA" : "MY PAGE · BEFORE PUBLISHING"}
      </span>
      <h2>{stage === "data" ? guidance.dataQuestion : "내 페이지를 보여주기 전에"}</h2>
      {stage === "data" ? (
        <>
          <p>
            {guidance.features[0].behavior} {guidance.features[0].storage}
          </p>
          <WorkbookTip title={<> 내 목적의 기능과 저장 범위 비교하기 </>}>
            <dl className={styles.purposeFeatures}>
              {guidance.features.map((feature) => (
                <div key={feature.name}>
                  <dt>{feature.name}</dt>
                  <dd>
                    {feature.behavior}
                    <br />
                    {feature.storage}
                  </dd>
                </div>
              ))}
            </dl>
          </WorkbookTip>
          <p>
            아래 한 줄 메모로 표시·저장·공유의 차이를 연습해요. 위 기능을 자동으로 만들거나 외부
            저장소에 연결하지 않아요.
          </p>
        </>
      ) : (
        <>
          <ul>
            {guidance.publishChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <p>{guidance.publicData}</p>
          <p>
            아래 공통 점검과 주소·문제 해결 예시에 이 기준을 적용해요. 실제 공개 여부는 내 파일의
            적용 기록으로 따로 남겨요.
          </p>
        </>
      )}
    </section>
  );
}
