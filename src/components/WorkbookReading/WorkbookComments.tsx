"use client";

// 댓글은 이번 워크북 방문의 메모리에서만 유지한다. 서버·인증·브라우저 저장소를 사용하지 않는다.
import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";
import styles from "./WorkbookComments.module.scss";

type Comment = { id: string; name: string; body: string };
type CommentsState = Record<string, Comment[]>;
const CommentsContext = createContext<{
  comments: CommentsState;
  add: (slug: string, name: string, body: string) => void;
  remove: (slug: string, id: string) => void;
} | null>(null);

export function WorkbookCommentsProvider({ children }: { children: ReactNode }) {
  const [comments, setComments] = useState<CommentsState>({});
  const add = (slug: string, name: string, body: string) => {
    const comment = { id: crypto.randomUUID(), name, body };
    setComments((current) => ({ ...current, [slug]: [...(current[slug] ?? []), comment] }));
  };
  const remove = (slug: string, id: string) =>
    setComments((current) => ({
      ...current,
      [slug]: (current[slug] ?? []).filter((entry) => entry.id !== id),
    }));
  return (
    <CommentsContext.Provider value={{ comments, add, remove }}>
      {children}
    </CommentsContext.Provider>
  );
}

export function WorkbookComments({ slug }: { slug: string }) {
  const context = useContext(CommentsContext);
  if (!context) throw new Error("WorkbookCommentsProvider is required");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const comments = context.comments[slug] ?? [];
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !body.trim()) {
      setMessage("이름과 댓글 내용을 입력해주세요.");
      return;
    }
    context.add(slug, name.trim(), body.trim());
    setBody("");
    setMessage("테스트 댓글을 남겼어요. 이번 방문에서만 볼 수 있어요.");
  };
  return (
    <section id="reading-comments" className={styles.comments} aria-labelledby="comments-title">
      <header>
        <span className="label">KEEP THE CONVERSATION GOING</span>
        <h2 id="comments-title">
          읽은 뒤의 생각 <span>{comments.length}</span>
        </h2>
        <p id="comments-scope">
          테스트 댓글이에요. 다른 방문자와 공유되지 않으며, 새로고침하거나 워크북을 벗어나면
          사라져요.
        </p>
      </header>
      <div className={styles.columns}>
        <form onSubmit={submit} aria-label="테스트 댓글 작성" aria-describedby="comments-scope">
          <label htmlFor="comment-name">이름</label>
          <input
            id="comment-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            required
            autoComplete="off"
            placeholder="함께 부를 이름"
          />
          <label htmlFor="comment-body">댓글</label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={600}
            required
            rows={3}
            placeholder="떠오른 질문이나 직접 시도해본 생각을 남겨보세요."
          />
          <div className={styles.actions}>
            <small>{body.length} / 600</small>
            <button type="submit">댓글 남기기 ↗</button>
          </div>
          <p className={styles.message} role="status">
            {message}
          </p>
        </form>
        <div className={styles.discussion}>
          {comments.length === 0 ? (
            <div className={styles.empty}>
              <p>어떤 생각이 떠올랐나요?</p>
              <span>짧은 질문이나 작은 발견도 좋아요.</span>
            </div>
          ) : (
            <ul aria-label="이 글의 테스트 댓글">
              {comments.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>{entry.name}</strong>
                    <button
                      type="button"
                      aria-label={`${entry.name} 댓글 삭제`}
                      onClick={() => {
                        context.remove(slug, entry.id);
                        setMessage("테스트 댓글을 삭제했어요.");
                      }}
                    >
                      삭제
                    </button>
                  </div>
                  <p>{entry.body}</p>
                  <small>이번 방문 · 테스트 댓글</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
