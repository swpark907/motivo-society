import { WorkbookTip } from "./WorkbookTip";
import { getWorkbookPageReview } from "@/lib/workbook-purpose";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookClass.module.scss";

// 확인 질문과 가져갈 요청 예시만 제공한다. 작성한 요청이나 학습 기록은 바꾸지 않는다.
export function WorkbookPageReview({ screen = false }: { screen?: boolean }) {
  const { purpose } = useWorkbookProgress();
  const review = getWorkbookPageReview(purpose);
  return (
    <section className={styles.pageReview} aria-label="내 목적에 맞는 화면 확인 기준">
      <span className="label">
        {screen ? "같은 목적 · 작은 화면에서도" : "첫 화면 · 내 목적에 맞게"}
      </span>
      <h2>{review.heading}</h2>
      {screen ? (
        <p>{review.screenCriterion}</p>
      ) : (
        <ul>
          {review.criteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>
      )}
      <WorkbookTip
        title={<>{screen ? "내 목적에 맞는 너비 수정 요청 예시" : "첫 화면 수정 요청 예시"}</>}
      >
        <p>
          내 화면에 이 문제가 있는지 먼저 확인하세요. 예시를 실제 관찰에 맞게 고쳐 외부 도구에
          보내요. 여기서 AI에 자동 전송하거나 파일을 수정하지 않아요.
        </p>
        <p className={styles.requestExample}>
          {screen
            ? `내 index.html에서 직접 확인한 문제: [화면 크기와 잘리는 내용을 적기]. 페이지 너비 한 부분만 화면에 맞게 고쳐줘. 제목·소개·목록과 내용 보기 버튼의 이동은 유지해줘. ${review.screenCriterion} 수정한 파일과 다시 확인할 방법을 알려줘. 다른 기능은 바꾸지 마.`
            : `${review.firstRevision} index.html만 바꾸고, 화면과 버튼을 다시 확인할 방법을 알려줘.`}
        </p>
      </WorkbookTip>
    </section>
  );
}
