import styles from "./WorkbookLlmNested.module.scss";

/**
 * 1-1 screen 4: what an LLM is. A quiet screen: prose, the three words of the name,
 * and a nested picture of AI ⊃ generative AI ⊃ LLM (not every generative AI is an LLM).
 */
export function WorkbookLlmNested() {
  return (
    <div data-lesson-wide>
      <div className={styles.layout}>
        <div className={styles.text}>
          <p>
            생성형 AI 중에는 <strong>아주 많은 글을 읽으며 언어를 익힌 AI</strong>가 있어요. 그래서
            사람이 쓴 말을 알아듣고, 말로 대답할 수 있어요.
          </p>
          <p>
            이런 AI를 <strong>LLM</strong>이라고 해요. 앞에서 본 대화도, 코드를 써 주는 것도 LLM이
            하는 일이에요.
          </p>
          <dl className={styles.name} aria-label="LLM이라는 이름 풀어 보기">
            <div>
              <dt>
                <span lang="en">Large</span> · 대규모
              </dt>
              <dd>아주 많은 글로 학습했어요.</dd>
            </div>
            <div>
              <dt>
                <span lang="en">Language</span> · 언어
              </dt>
              <dd>사람의 말과 글을 다뤄요.</dd>
            </div>
            <div>
              <dt>
                <span lang="en">Model</span> · 모델
              </dt>
              <dd>학습으로 만들어진 AI 프로그램이에요.</dd>
            </div>
          </dl>
        </div>
        <figure className={styles.figure}>
          <div className={styles.nest}>
            <section className={styles.ai} aria-labelledby="nest-ai">
              <h3 id="nest-ai">AI</h3>
              <p>사진 속 동물 알아보기 · 스팸 메일 거르기</p>
              <section className={styles.generative} aria-labelledby="nest-generative">
                <h3 id="nest-generative">생성형 AI</h3>
                <p>그림 만들기 · 음악 만들기</p>
                <section className={styles.llm} aria-labelledby="nest-llm">
                  <h3 id="nest-llm">LLM</h3>
                  <p>대화하기 · 글 쓰기 · 코드 쓰기</p>
                </section>
              </section>
            </section>
          </div>
          <figcaption>
            생성형 AI가 모두 LLM은 아니에요. 그림이나 소리를 만드는 데 집중한 AI도 있어요.
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
