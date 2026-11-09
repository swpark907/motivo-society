"use client";

// 클라이언트 컴포넌트인 이유: 저장한 공지 문구를 골라 본문에 넣고, 글자 수를 바로 보여 준다.
// 보내기는 서버 액션 → DB(notice_post)가 받을 사람을 그 순간의 명단으로 정한다.
import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton/SubmitButton";
import type { NoticeAudience } from "@/lib/platform/host-notices";
import { postNoticeAction } from "./actions";
import s from "./manage.module.scss";

const MAX = 1000;

export function NoticeComposer({
  activityId,
  counts,
  snippets,
}: {
  activityId: string;
  counts: Record<NoticeAudience, number>;
  snippets: { id: string; title: string; body: string }[];
}) {
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const options: { value: NoticeAudience; label: string }[] = [
    { value: "confirmed", label: "확정" },
    { value: "waitlisted", label: "대기" },
    { value: "pending_payment", label: "입금 대기" },
  ];

  return (
    <form action={postNoticeAction} className={s.noticeForm} aria-label="공지 남기기">
      <input type="hidden" name="activityId" value={activityId} />
      <fieldset className={s.kindPick}>
        <legend>누구에게</legend>
        {options.map((o) => (
          <label key={o.value} data-disabled={counts[o.value] === 0 || undefined}>
            <input
              type="checkbox"
              name="audience"
              value={o.value}
              defaultChecked={o.value === "confirmed" && counts.confirmed > 0}
              disabled={counts[o.value] === 0}
            />
            <span>
              {o.label} {counts[o.value]}명
            </span>
          </label>
        ))}
      </fieldset>

      {snippets.length > 0 && (
        <label className={s.formField}>
          <span>저장한 문구 넣기</span>
          <select
            value=""
            onChange={(e) => {
              const sn = snippets.find((x) => x.id === e.target.value);
              if (!sn) return;
              setBody((b) => (b.trim() ? `${b}\n\n${sn.body}` : sn.body).slice(0, MAX));
              if (!title.trim()) setTitle(sn.title.slice(0, 40));
            }}
          >
            <option value="">고르기</option>
            {snippets.map((sn) => (
              <option key={sn.id} value={sn.id}>
                {sn.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={s.formField}>
        <span>제목 (선택)</span>
        <input
          name="title"
          maxLength={40}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className={`${s.formField} ${s.wideField}`}>
        <span>
          내용{" "}
          <small>
            {body.length}/{MAX}자
          </small>
        </span>
        <textarea
          name="body"
          required
          maxLength={MAX}
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <p className={s.hint}>
        지금 고른 상태인 사람들이 받아요. 받은 사람은 활동 화면에서 보고, 메일·알림으로 따로 가지는
        않아요.
      </p>
      <SubmitButton className={s.primarySmall} pendingLabel="남기는 중…">
        공지 남기기
      </SubmitButton>
    </form>
  );
}
