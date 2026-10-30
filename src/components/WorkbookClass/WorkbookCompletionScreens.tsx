"use client";

// 기획/학습 예시와 사용자가 직접 첨부한 화면을 분리한다. 첨부와 영역 기록은 브라우저에 임시 저장한다.
import { useEffect, useRef, useState, type RefObject } from "react";
import { ResponsivePagePreview } from "@/components/WorkbookJourney/ResponsivePagePreview";
import { WorkbookMarkedScreenshot, type MarkedScreenshotHandle } from "./WorkbookMarkedScreenshot";
import { useWorkbookProgress } from "./WorkbookProgressContext";
import styles from "./WorkbookCompletionScreens.module.scss";

type Stage = "project" | "experience";
type Mode = "example" | "actual";
export function WorkbookCompletionScreens({ stage }: { stage: Stage }) {
  const { project, resultScreens, resultAnnotations, resultDraft } = useWorkbookProgress();
  const [mode, setMode] = useState<Mode | null>(null);
  const summaryImages = useRef<Partial<Record<"before" | "after", MarkedScreenshotHandle>>>({});
  const summaryNotes = useRef(new Map<string, HTMLButtonElement>());
  function rememberSummaryNote(id: string, element: HTMLButtonElement | null) {
    if (element) summaryNotes.current.set(id, element);
    else summaryNotes.current.delete(id);
  }
  function showSummaryArea(key: "before" | "after", id: string) {
    summaryImages.current[key]?.showArea(id);
  }
  const actualButton = useRef<HTMLButtonElement>(null);
  const variants = stage === "experience" ? [false, true] : [true];
  const count = Object.values(resultScreens[stage]).filter(Boolean).length;
  return (
    <div className={styles.screens} data-completion-screens data-stage={stage}>
      <div className={styles.draftStatus} role="status" aria-label="첨부 임시 저장 상태">
        <small>{resultDraft.status}</small>
        {resultDraft.status.includes("실패") && (
          <button type="button" onClick={resultDraft.retrySave}>
            저장 다시 시도
          </button>
        )}
      </div>
      <h3>
        {count
          ? "직접 첨부한 결과"
          : stage === "project"
            ? "내 기획으로 구성한 화면"
            : "수정 전후 · 학습 예시"}
      </h3>
      <div className={styles.thumbnails}>
        {count
          ? (["before", "after"] as const)
              .filter((key) => resultScreens[stage][key])
              .map((key) => (
                <div className={styles.tile} key={key}>
                  <div className={styles.actualSummaryImage}>
                    <WorkbookMarkedScreenshot
                      src={resultScreens[stage][key]!}
                      ref={(handle) => {
                        if (handle) summaryImages.current[key] = handle;
                        else delete summaryImages.current[key];
                      }}
                      onNoteSelect={(id) => {
                        const note = summaryNotes.current.get(id);
                        note?.scrollIntoView({ block: "center", behavior: "instant" });
                        note?.focus({ preventScroll: true });
                      }}
                      showNotes={false}
                      alt={key === "before" ? "직접 첨부한 수정 전 화면" : "직접 첨부한 결과 화면"}
                      marks={stage === "experience" ? resultAnnotations[key] : []}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("actual")}
                    aria-label={
                      stage === "project"
                        ? "내가 만든 페이지 크게 보기"
                        : key === "before"
                          ? "직접 첨부한 수정 전 크게 보기"
                          : "직접 첨부한 수정 후 크게 보기"
                    }
                  >
                    <span>
                      {stage === "project" ? "내 페이지" : key === "before" ? "수정 전" : "수정 후"}{" "}
                      ↗
                    </span>
                  </button>
                </div>
              ))
          : variants.map((after) => (
              <div className={styles.tile} key={String(after)}>
                <div className={styles.thumbnail} inert aria-hidden="true">
                  <div
                    className={styles.markedPreview}
                    data-change={stage === "experience" ? (after ? "after" : "before") : undefined}
                  >
                    <ResponsivePagePreview
                      screen={stage === "project" ? "desktop" : "mobile"}
                      fluid={after}
                      stack
                      page={project}
                      onButton={() => {}}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("example")}
                  aria-label={
                    stage === "project"
                      ? "기획 미리보기 크게 보기"
                      : `${after ? "수정 후" : "수정 전"} 예시 크게 보기`
                  }
                >
                  <span>
                    {stage === "project" ? "기획 미리보기" : after ? "수정 후" : "수정 전"} ↗
                  </span>
                </button>
              </div>
            ))}
      </div>
      {count > 0 &&
        stage === "experience" &&
        (["before", "after"] as const).map(
          (key) =>
            resultScreens[stage][key] &&
            resultAnnotations[key].length > 0 && (
              <div
                key={key}
                className={styles.changeExplanation}
                aria-label={`${key === "before" ? "수정 전" : "수정 후"} 개선 기록`}
              >
                <strong>{key === "before" ? "수정 전" : "수정 후"} · 내가 개선한 점</strong>
                <ol>
                  {resultAnnotations[key].map((mark) => (
                    <SummaryNote
                      key={mark.id}
                      id={mark.id}
                      text={mark.note}
                      screen={key}
                      register={rememberSummaryNote}
                      onShow={showSummaryArea}
                    />
                  ))}
                </ol>
              </div>
            ),
        )}
      {!count && stage === "experience" && <ChangeExplanation />}
      <small>
        {count
          ? "본인이 첨부한 화면 · 제작 여부를 자동 검증하지 않아요."
          : "입력한 기획을 배치한 예시 · 실제 파일 화면과 달라요."}
      </small>
      <button
        type="button"
        disabled={!resultDraft.ready}
        ref={actualButton}
        className={styles.actualButton}
        onClick={() => setMode("actual")}
      >
        {count ? `직접 첨부한 화면 ${count}장 보기` : "내가 만든 화면 첨부하기"}
      </button>
      {mode && (
        <ScreenDialog
          stage={stage}
          initialMode={mode}
          fallback={actualButton}
          onClose={() => setMode(null)}
        />
      )}
    </div>
  );
}

function ScreenDialog({
  stage,
  initialMode,
  fallback,
  onClose,
}: {
  stage: Stage;
  initialMode: Mode;
  fallback: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const {
    project,
    resultDraft,
    resultScreens,
    setResultScreens,
    resultAnnotations,
    setResultAnnotations,
    beginAnnotationEdit,
    endAnnotationEdit,
    cancelAnnotationEdit,
    undoAnnotations,
    redoAnnotations,
    resetScreenAnnotations,
    canUndoAnnotations,
    canRedoAnnotations,
  } = useWorkbookProgress();
  const [mode, setMode] = useState(initialMode);
  const [screen, setScreen] = useState<"mobile" | "desktop">("mobile");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    const fallbackElement = fallback.current;
    element?.showModal();
    return () => {
      element?.close();
      endAnnotationEdit();
      if (opener?.isConnected) opener.focus();
      else if (fallbackElement?.isConnected) fallbackElement.focus();
    };
  }, [fallback, endAnnotationEdit]);
  async function attach(file: File | undefined, key: "before" | "after") {
    if (!file || !resultDraft.ready) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("PNG·JPG·WebP 이미지 중 5MB 이하 파일을 골라주세요.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      });
      // 읽을 수 없는 이미지 파일은 결과로 남기지 않는다.
      await new Promise<void>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = data;
      });
      if (stage === "experience") resetScreenAnnotations(key);
      setResultScreens((previous) => ({
        ...previous,
        [stage]: { ...previous[stage], [key]: data },
      }));
    } catch {
      setError("이미지를 열지 못했어요. 다른 파일을 골라주세요.");
    } finally {
      setBusy(false);
    }
  }
  const keys = stage === "experience" ? (["before", "after"] as const) : (["after"] as const);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="completion-screen-title"
      onKeyDown={(event) => {
        if (
          mode !== "actual" ||
          stage !== "experience" ||
          event.defaultPrevented ||
          event.nativeEvent.isComposing ||
          event.altKey ||
          !(event.ctrlKey || event.metaKey) ||
          event.key.toLowerCase() !== "z"
        )
          return;
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.isContentEditable || target.closest("input, textarea, select, [role='textbox']"))
        )
          return;
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedoAnnotations) redoAnnotations();
        } else if (canUndoAnnotations) undoAnnotations();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <header className={styles.header}>
        <h2 id="completion-screen-title">완료한 화면 살펴보기</h2>
        {mode === "actual" && stage === "experience" && (
          <div className={styles.historyTools} aria-label="영역 편집 기록">
            <button
              type="button"
              aria-keyshortcuts="Control+Z Meta+Z"
              disabled={!canUndoAnnotations}
              onClick={undoAnnotations}
            >
              실행 취소
            </button>
            <button
              type="button"
              aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z"
              disabled={!canRedoAnnotations}
              onClick={redoAnnotations}
            >
              다시 실행
            </button>
          </div>
        )}
        <button type="button" onClick={onClose} aria-label="완료 화면 닫기">
          닫기 ×
        </button>
      </header>
      <div className={styles.modes} aria-label="화면 출처 선택">
        <button type="button" aria-pressed={mode === "example"} onClick={() => setMode("example")}>
          기획·학습 예시
        </button>
        <button type="button" aria-pressed={mode === "actual"} onClick={() => setMode("actual")}>
          직접 첨부한 화면
        </button>
      </div>
      {mode === "actual" && stage === "experience" && (
        <div className={styles.historyHint}>
          {" "}
          <small>
            Ctrl/Cmd+Z로 취소 · Ctrl/Cmd+Shift+Z로 다시 실행. 입력 중에는 글자 수정이 우선돼요.
          </small>
          <small>
            영역·설명 편집을 되돌려요. 사진을 바꾸거나 제거하면 이전 편집 기록은 초기화돼요.
          </small>
        </div>
      )}
      {mode === "example" ? (
        <>
          <p>
            입력한 기획으로 워크북에서 구성한 예시예요. 내 컴퓨터의 실제 파일이나 AI 응답을 가져온
            화면은 아니에요.
          </p>
          <div className={styles.modes} aria-label="예시 화면 너비">
            <button
              type="button"
              aria-pressed={screen === "mobile"}
              onClick={() => setScreen("mobile")}
            >
              모바일 너비
            </button>
            <button
              type="button"
              aria-pressed={screen === "desktop"}
              onClick={() => setScreen("desktop")}
            >
              PC 너비
            </button>
          </div>
          {stage === "experience" && <ChangeExplanation desktop={screen === "desktop"} />}
          <div className={styles.previews}>
            {(stage === "experience" ? [false, true] : [true]).map((after) => (
              <figure key={String(after)}>
                <figcaption>
                  {stage === "project"
                    ? "기획 구성 미리보기"
                    : after
                      ? "수정 후 · 화면 너비에 맞춘 예시"
                      : screen === "mobile"
                        ? "수정 전 · 모바일에서 너비가 넘치는 예시"
                        : "수정 전 · 고정 너비 예시"}
                </figcaption>
                <small className={styles.widthNote}>
                  {screen === "mobile" && !after
                    ? "페이지 560px / 화면 280px · 좌우로 밀어 넘친 부분을 확인해요."
                    : `페이지와 화면 ${screen === "mobile" ? 280 : 560}px · 화면 너비에 맞아요.`}
                </small>
                <div
                  className={styles.markedPreview}
                  data-change={
                    stage === "experience" && screen === "mobile"
                      ? after
                        ? "after"
                        : "before"
                      : undefined
                  }
                >
                  <ResponsivePagePreview
                    screen={screen}
                    fluid={after}
                    stack
                    page={project}
                    label={
                      stage === "project"
                        ? "완료 요약 기획 예시"
                        : after
                          ? "완료 요약 수정 후 예시"
                          : "완료 요약 수정 전 예시"
                    }
                    onButton={() => {}}
                  />
                </div>
              </figure>
            ))}
          </div>
        </>
      ) : (
        <>
          <p>
            직접 만든 페이지의 스크린샷을 골라주세요. 본인이 첨부한 자료이며, 워크북이 실제 제작
            여부를 검증한 결과는 아니에요.
          </p>
          <div className={styles.draftStatus} role="status" aria-label="첨부 편집 저장 상태">
            <small>{resultDraft.status}</small>
            {resultDraft.status.includes("실패") && (
              <button type="button" onClick={resultDraft.retrySave}>
                저장 다시 시도
              </button>
            )}
          </div>
          <small>
            서버로 전송하지 않고 이 브라우저에 임시 저장해요. 같은 브라우저에서 이어서 수정할 수
            있어요. 브라우저 데이터를 지우면 삭제돼요. PNG·JPG·WebP, 장당 5MB 이하.
          </small>
          <div className={styles.previews}>
            {keys.map((key) => {
              const title =
                stage === "project"
                  ? "내가 만든 페이지"
                  : key === "before"
                    ? "내 화면 · 수정 전"
                    : "내 화면 · 수정 후";
              const src = resultScreens[stage][key];
              return (
                <section className={styles.attachment} key={key} aria-label={title}>
                  <h3>{title}</h3>
                  {src ? (
                    <WorkbookMarkedScreenshot
                      src={src}
                      alt={`${title} · 직접 첨부한 스크린샷`}
                      marks={stage === "experience" ? resultAnnotations[key] : []}
                      onEditBegin={stage === "experience" ? beginAnnotationEdit : undefined}
                      onEditEnd={stage === "experience" ? endAnnotationEdit : undefined}
                      onEditCancel={stage === "experience" ? cancelAnnotationEdit : undefined}
                      onChange={
                        stage === "experience"
                          ? (mark) =>
                              setResultAnnotations((previous) => ({ ...previous, [key]: mark }))
                          : undefined
                      }
                    />
                  ) : (
                    <p>아직 첨부한 화면이 없어요.</p>
                  )}
                  <label>
                    {src ? "다른 이미지로 바꾸기" : "스크린샷 선택"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label={`${title} 스크린샷 선택`}
                      disabled={busy || !resultDraft.ready}
                      onChange={(event) => {
                        void attach(event.target.files?.[0], key);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {src && (
                    <button
                      type="button"
                      disabled={busy || !resultDraft.ready}
                      onClick={() => {
                        if (stage === "experience") resetScreenAnnotations(key);
                        setResultScreens((previous) => ({
                          ...previous,
                          [stage]: { ...previous[stage], [key]: null },
                        }));
                      }}
                    >
                      {title} 첨부 제거
                    </button>
                  )}
                </section>
              );
            })}
          </div>
          {busy && <p role="status">이미지를 확인하고 있어요.</p>}
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </dialog>
  );
}

function ChangeExplanation({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={styles.changeExplanation} aria-label="예시에서 개선한 점">
      <strong>화면 밖으로 넘치던 내용을, 화면 안으로</strong>
      <p>
        {desktop
          ? "PC에서는 두 페이지 모두 560px이라 차이가 작아요. 모바일 너비로 바꾸면 개선된 부분을 확인할 수 있어요."
          : "점선은 내용이 잘리는 화면 끝, 실선은 수정 후 화면에 맞춘 경계예요. 페이지를 고정 560px에서 화면에 맞는 너비로 바꿔, 같은 내용을 좌우로 밀지 않고 읽을 수 있게 했어요."}
      </p>
    </div>
  );
}

function SummaryNote({
  id,
  text,
  screen,
  register,
  onShow,
}: {
  id: string;
  text: string;
  screen: "before" | "after";
  register: (id: string, element: HTMLButtonElement | null) => void;
  onShow: (screen: "before" | "after", id: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={styles.summaryNote}
        ref={(element) => register(id, element)}
        onClick={() => onShow(screen, id)}
      >
        {text.trim() || "설명을 아직 적지 않았어요."}
      </button>
    </li>
  );
}
