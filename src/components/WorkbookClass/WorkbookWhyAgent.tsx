import styles from "./WorkbookWhyAgent.module.scss";

/** Rows compare what the learner gets, not which tool is "better": the builder wins on speed. */
const ROWS = [
  {
    label: "처음 만들 때",
    builder: "빨라요. 틀을 고르면 바로 나와요.",
    agent: "준비가 조금 필요해요. 1-4에서 같이 해요.",
  },
  {
    label: "결과가 남는 곳",
    builder: "주로 그 서비스 안. 내보내기는 서비스마다 달라요.",
    agent: "내 컴퓨터의 파일",
  },
  {
    label: "고칠 수 있는 범위",
    builder: "서비스가 준비한 기능 안에서",
    agent: "파일을 직접 고치니 정해진 틀이 없어요.",
  },
  {
    label: "하다 보면 알게 되는 것",
    builder: "그 서비스를 쓰는 법",
    agent: "웹이 어떻게 만들어지는지",
  },
] as const;

/**
 * 1-2 screen 4: why this class uses a code agent. A quiet comparison table (a form neither 1-1
 * nor the earlier 1-2 screens used). It says what fits this class's goal, without putting the
 * website builders down. The only motion is the hand-drawn ring around our column, drawn once.
 */
export function WorkbookWhyAgent() {
  return (
    <div data-lesson-wide className={styles.why}>
      <h2 id="lesson-screen-title" className={styles.title}>
        왜 코드 에이전트일까요
      </h2>
      <p className={styles.lead}>
        버튼 몇 번으로 만들어 주는 웹사이트 빌더가 더 빠를 때도 있어요. 그래도 이 클래스는 코드
        에이전트를 써요. 둘을 나란히 놓고 볼게요.
      </p>

      <table className={styles.table}>
        <caption className={styles.srOnly}>웹사이트 빌더와 코드 에이전트 비교</caption>
        <thead>
          <tr>
            <td />
            <th scope="col">웹사이트 빌더</th>
            <th scope="col" className={styles.ours}>
              <span className={styles.ring}>
                코드 에이전트
                <svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M12 32C10 12 60 5 104 6c50 1 88 8 86 26-2 17-48 23-94 22C52 53 14 50 12 32z" />
                </svg>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.builder}</td>
              <td className={styles.ours}>{row.agent}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.closing}>
        <p>빠르게 한 번 만들고 끝낼 거라면 웹사이트 빌더도 좋은 선택이에요.</p>
        <p>
          우리는 만든 것을 계속 고치고 키워 갈 거라서 <strong>코드 에이전트</strong>를 골랐어요.
          지금 만드는 파일은 5단원에서 그대로 인터넷에 올려요.
        </p>
      </div>
    </div>
  );
}
