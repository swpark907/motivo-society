"use client";

// 클라이언트 컴포넌트인 이유: 현장에서 이름을 누를 때마다 화면을 다시 불러오지 않고 바로 표시하고(낙관적 갱신),
// 실패하면 되돌리며 이름으로 찾는다. 기록 자체는 서버 액션 → DB(attendance_mark)가 한다.
import { useMemo, useState, useTransition } from "react";
import { quickMarkAction } from "./actions";
import s from "./check.module.scss";

type Mark = "attended" | "absent" | null;
type Person = { userId: string; nickname: string; attendance: Mark };

export function QuickCheck({ activityId, people }: { activityId: string; people: Person[] }) {
  const [marks, setMarks] = useState<Record<string, Mark>>(() =>
    Object.fromEntries(people.map((p) => [p.userId, p.attendance])),
  );
  // 저장 중인 사람들(여러 명을 연달아 눌러도 각자 따로 잠근다)
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const counts = useMemo(() => {
    const v = Object.values(marks);
    return {
      attended: v.filter((m) => m === "attended").length,
      absent: v.filter((m) => m === "absent").length,
      unchecked: v.filter((m) => m === null).length,
    };
  }, [marks]);

  const shown = people.filter((p) => !query.trim() || p.nickname.includes(query.trim()));

  function mark(p: Person, status: "attended" | "absent") {
    const before = marks[p.userId];
    if (before === status) return;
    setMarks((m) => ({ ...m, [p.userId]: status }));
    setBusy((b) => new Set(b).add(p.userId));
    setError(null);
    startTransition(async () => {
      const r = await quickMarkAction(activityId, p.userId, status);
      if (r.error) {
        setMarks((m) => ({ ...m, [p.userId]: before }));
        setError(`${p.nickname}: ${r.error}`);
      }
      setBusy((b) => {
        const next = new Set(b);
        next.delete(p.userId);
        return next;
      });
    });
  }

  return (
    <div className={s.wrap}>
      <p className={s.counter} role="status" aria-live="polite">
        참석 <strong>{counts.attended}</strong> · 불참 <strong>{counts.absent}</strong> · 아직{" "}
        <strong>{counts.unchecked}</strong>
        {/* 숫자는 누르자마자 바뀌지만 저장은 뒤에서 끝난다. 끝나기 전에 화면을 떠나면 빠질 수 있어 알린다(검수 F-025). */}
        {busy.size > 0 && <span className={s.saving}> · 저장 중…</span>}
      </p>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {people.length > 8 && (
        <label className={s.search}>
          <span>이름으로 찾기</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      )}
      <ul className={s.list}>
        {shown.map((p) => {
          const m = marks[p.userId];
          return (
            <li key={p.userId} className={s.row} data-mark={m ?? "none"}>
              <span className={s.name}>{p.nickname}</span>
              <div className={s.buttons} role="group" aria-label={`${p.nickname} 출석`}>
                {(["attended", "absent"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    aria-pressed={m === st}
                    disabled={busy.has(p.userId)}
                    onClick={() => mark(p, st)}
                  >
                    {st === "attended" ? "참석" : "불참"}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
