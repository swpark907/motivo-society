import { Fragment } from "react";
import type { InputFeedbackItem } from "@/lib/editorial/input-feedback";
import styles from "./EditorialPreview.module.scss";
export function InputFeedback({
  id,
  feedback,
  onJump,
}: {
  id: string;
  feedback: InputFeedbackItem[];
  onJump: (key: string) => void;
}) {
  return feedback.length ? (
    <div id={id} role="status" className={styles.inputFeedback}>
      {feedback.slice(0, 2).map((item) => (
        <Fragment key={`${item.fieldKey}-${item.message}`}>
          {item.fieldKey ? (
            <button
              type="button"
              className={styles.feedbackLink}
              onClick={() => onJump(item.fieldKey!)}
            >
              {item.message}
            </button>
          ) : (
            <span>{item.message}</span>
          )}{" "}
        </Fragment>
      ))}
      {feedback.length > 2 && `그 외 ${feedback.length - 2}곳도 확인해주세요.`}
    </div>
  ) : null;
}
