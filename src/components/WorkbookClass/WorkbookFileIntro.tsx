import styles from "./WorkbookFileIntro.module.scss";

/**
 * The three sentences shown in the finished page. They are the example answer from the previous
 * lesson after its two fixes, so the learner sees the same text turn into a page.
 */
const INTRO = [
  "안녕하세요, 커피와 산책을 좋아하는 직장인이에요.",
  "커피 한 잔 들고 천천히 걷는 시간을 좋아해요.",
  "들러 주셔서 반가워요.",
] as const;

/**
 * 1-6 screen 1: what changes today, as one row of three drawings (empty folder → one file → a
 * page in the browser). Nothing to press. The drawings are our own and show no real app.
 */
export function WorkbookFileIntro() {
  return (
    <div data-lesson-wide className={styles.intro}>
      <h2 id="lesson-screen-title" className={styles.title}>
        오늘은 진짜 파일을 만들어요
      </h2>
      <div className={styles.lead}>
        <p>
          지난 수업에서는 AI에게 글만 부탁했죠. 오늘은 AI가 내 폴더에 진짜 파일을 만듭니다. 그
          파일을 열면 브라우저에 웹 페이지로 보여요.
        </p>
      </div>

      <ol className={styles.row}>
        <li className={styles.step}>
          <span className={styles.when}>지금</span>
          <div className={styles.folder}>
            <span className={styles.tab} aria-hidden="true" />
            <div className={styles.inside}>
              <p className={styles.empty}>비어 있어요</p>
            </div>
          </div>
          <p className={styles.caption}>
            <code>my-first-web</code> 폴더
          </p>
        </li>
        <li className={styles.step}>
          <span className={styles.when}>AI에게 부탁하면</span>
          <div className={styles.folder}>
            <span className={styles.tab} aria-hidden="true" />
            <div className={styles.inside}>
              <div className={styles.file}>
                <span className={styles.sheet} aria-hidden="true" />
                <code>index.html</code>
              </div>
            </div>
          </div>
          <p className={styles.caption}>폴더에 파일 한 개가 생겨요</p>
        </li>
        <li className={styles.step}>
          <span className={styles.when}>그 파일을 열면</span>
          <div className={styles.browser}>
            <div className={styles.bar} aria-hidden="true">
              <i />
              <i />
              <i />
              <span>index.html</span>
            </div>
            <div className={styles.page}>
              <strong>내 소개</strong>
              {INTRO.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <p className={styles.caption}>브라우저에 화면이 나와요</p>
        </li>
      </ol>

      <p className={styles.closing}>
        화면에는 지난 수업에서 받은 소개 글을 넣어요(없으면 자리만 만들어 둬요). 파일 안에는
        브라우저가 읽는 글, <strong>HTML 코드</strong>가 들어 있습니다. 파일 이름{" "}
        <code>index.html</code>은 웹 페이지의 첫 화면에 흔히 붙이는 이름이에요.
      </p>
    </div>
  );
}
