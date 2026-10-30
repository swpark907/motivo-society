"use client";

// 배치·수집 탐색을 시험하는 방문 메모리 시안이다. 실제 보상이나 회원 데이터는 변경하지 않는다.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  collectibles,
  initialArrangement,
  slots,
  type Arrangement,
  type Collectible,
  type SlotId,
} from "./collectibles";
import styles from "./WorkbookSpacePreview.module.scss";

function ObjectArt({ item }: { item: Collectible }) {
  if (item.kind === "book" || item.kind === "cup")
    return (
      <Image
        className={styles.objectImage}
        src={`/images/workbook/desk/${item.kind}.png`}
        alt=""
        width={240}
        height={240}
      />
    );
  return (
    <span className={styles.objectDrawing} data-kind={item.kind} aria-hidden="true">
      <span>
        {item.kind === "frame"
          ? "MY FIRST PAGE"
          : item.kind === "sign"
            ? "OPEN"
            : item.kind === "drawer"
              ? "NOTES"
              : "0 ┊ ┊ ┊ ┊ 10"}
      </span>
    </span>
  );
}
export function WorkbookSpacePreview() {
  const [view, setView] = useState<"room" | "collection" | "chapters">("room");
  const [placed, setPlaced] = useState<Arrangement>(initialArrangement);
  const [draft, setDraft] = useState<Arrangement>(initialArrangement);
  const [editing, setEditing] = useState(false);
  const editTitle = useRef<HTMLHeadingElement>(null);
  const decorateButton = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (editing) editTitle.current?.focus();
    else if (wasEditing.current) decorateButton.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  const [slot, setSlot] = useState<SlotId>("deskLeft");
  const [selected, setSelected] = useState<string>("plan");
  const [message, setMessage] = useState("");
  const arrangement = editing ? draft : placed;
  const item = collectibles.find((entry) => entry.id === selected)!;
  const activeSlot = slots.find((entry) => entry.id === slot)!;
  function startEdit(target?: SlotId) {
    setDraft({ ...placed });
    setSlot(target ?? "deskLeft");
    setEditing(true);
    setView("room");
    setMessage("");
  }
  function place(id: string | null) {
    setDraft((current) => {
      const next = { ...current };
      if (id)
        for (const key of Object.keys(next) as SlotId[]) if (next[key] === id) next[key] = null;
      next[slot] = id;
      return next;
    });
  }
  return (
    <section className={styles.space} aria-labelledby="space-title">
      <header className={styles.header}>
        <div>
          <span className="label">MY WORKSPACE / 제안 시안</span>
          <h2 id="space-title">배운 것들이 머무는 자리.</h2>
          <p>카피바라와 함께 돌아오는 작은 작업실. 꺼내 놓지 않은 물건도 수집함에 남아요.</p>
        </div>
        <span className={styles.count}>
          수집품 <b>{collectibles.filter((entry) => entry.earned).length}</b> /{" "}
          {collectibles.length} <small>기본 소품 포함 · 예시</small>
        </span>
      </header>
      <nav className={styles.tabs} aria-label="작업 공간 보기">
        {(
          [
            ["room", "작업 공간"],
            ["collection", "수집함"],
            ["chapters", "단원별 수집품"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            disabled={editing}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {view === "chapters" ? (
        <div className={styles.chapters}>
          {collectibles
            .filter((entry) => entry.id !== "cup")
            .map((entry, index) => (
              <article key={entry.id}>
                <span className={styles.step}>{String(index + 1).padStart(2, "0")}</span>
                <ObjectArt item={entry} />
                <div>
                  <small>{entry.origin}</small>
                  <h3>{entry.chapter}</h3>
                  <p>{entry.condition}</p>
                  <strong>{entry.name}</strong>
                  <span className={styles.where}>
                    {slots
                      .filter((place) =>
                        (place.accepts as readonly string[]).includes(entry.category),
                      )
                      .map((place) => place.name)
                      .join(" · ")}
                  </span>
                </div>
              </article>
            ))}
        </div>
      ) : (
        <div className={styles.workspace} data-editing={editing}>
          <div>
            {view === "room" ? (
              <>
                <div className={styles.scene} aria-label="카피바라 작업 공간">
                  <Image
                    src="/images/workbook/desk/room-v3.png"
                    alt="책상 앞에서 기다리는 카피바라와 따뜻한 작업실"
                    fill
                    sizes="(min-width: 1024px) 70vw, 100vw"
                    className={styles.roomImage}
                  />
                  <span className={styles.sceneNote}>
                    공간 배치 시안 · 기존 배경과 임시 소품 사용
                  </span>
                  {slots.map((place, index) => {
                    const object = collectibles.find((entry) => entry.id === arrangement[place.id]);
                    return (
                      <button
                        key={place.id}
                        type="button"
                        className={styles.slot}
                        data-slot={place.id}
                        data-editing={editing}
                        aria-label={
                          editing
                            ? `${place.name} 자리 선택`
                            : `${place.name}: ${object?.name ?? "비어 있음"}`
                        }
                        aria-pressed={editing ? slot === place.id : undefined}
                        onClick={() => {
                          if (editing) setSlot(place.id);
                          else if (object) setSelected(object.id);
                          else startEdit(place.id);
                        }}
                      >
                        {object && <ObjectArt item={object} />}
                        <span>
                          {editing
                            ? `${index + 1}. ${place.name}`
                            : (object?.name ?? `${place.name} +`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.sceneFooter}>
                  <p>
                    {editing
                      ? "바꿀 자리를 고르고 수집품을 놓아보세요."
                      : "물건을 누르면 그때의 기록을 볼 수 있어요."}
                  </p>
                  {!editing && (
                    <button type="button" ref={decorateButton} onClick={() => startEdit()}>
                      공간 꾸미기 ↗
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.collection}>
                <p>가지고 있는 물건은 그대로. 보여줄 물건만 골라요.</p>
                <div className={styles.collectionGrid}>
                  {collectibles.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={styles.collectible}
                      data-locked={!entry.earned}
                      aria-pressed={selected === entry.id}
                      onClick={() => setSelected(entry.id)}
                    >
                      <ObjectArt item={entry} />
                      <small>
                        {entry.earned
                          ? Object.values(placed).includes(entry.id)
                            ? "전시 중"
                            : "보관 중"
                          : "미획득 · 조건 보기"}
                      </small>
                      <strong>{entry.name}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className={styles.status} role="status">
              {message ||
                "예시 수집품·기록이에요. 변경은 이 화면에서만 유지되며 새로고침하면 초기화돼요."}
            </p>
          </div>
          <aside className={styles.panel} aria-label={editing ? "배치 도구" : "수집품 상세"}>
            {editing ? (
              <>
                <span className="label">DECORATE</span>
                <h3 ref={editTitle} tabIndex={-1}>
                  {activeSlot.name}
                </h3>
                <p>이 자리에 놓을 수 있는 내 수집품</p>
                <div className={styles.slotChoices}>
                  {slots.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      aria-pressed={slot === place.id}
                      onClick={() => setSlot(place.id)}
                    >
                      {place.name}
                    </button>
                  ))}
                </div>
                <div className={styles.choices}>
                  {collectibles
                    .filter(
                      (entry) =>
                        entry.earned &&
                        (activeSlot.accepts as readonly string[]).includes(entry.category),
                    )
                    .map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        aria-pressed={draft[slot] === entry.id}
                        onClick={() => place(entry.id)}
                      >
                        <ObjectArt item={entry} />
                        <span>
                          {entry.name}
                          <small>
                            {Object.entries(draft).some(
                              ([key, val]) => key !== slot && val === entry.id,
                            )
                              ? "선택하면 현재 자리에서 옮겨요"
                              : "선택해 미리 보기"}
                          </small>
                        </span>
                      </button>
                    ))}
                  {!collectibles.some(
                    (entry) =>
                      entry.earned &&
                      (activeSlot.accepts as readonly string[]).includes(entry.category),
                  ) && (
                    <p>
                      아직 이 자리에 놓을 수 있는 수집품이 없어요. 배포하고 고치기를 마치면 작은
                      오픈 간판을 만나요.
                    </p>
                  )}
                </div>
                <button type="button" className={styles.clear} onClick={() => place(null)}>
                  이 자리는 비워두기
                </button>
                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setMessage("배치 변경을 취소했어요.");
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaced({ ...draft });
                      setEditing(false);
                      setMessage(
                        "선택한 배치를 적용했어요. 수집함의 물건은 사라지지 않아요. (시안 · 새로고침 시 초기화)",
                      );
                    }}
                  >
                    배치 저장
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="label">{item.earned ? "IN MY COLLECTION" : "NEXT SOUVENIR"}</span>
                <div className={styles.detailArt}>
                  <ObjectArt item={item} />
                </div>
                <h3>{item.name}</h3>
                <p>{item.chapter}</p>
                <dl>
                  <dt>만난 곳</dt>
                  <dd>{item.origin}</dd>
                  <dt>{item.earned ? "획득 조건 · 예시 달성" : "획득하려면"}</dt>
                  <dd>{item.condition}</dd>
                  <dt>놓을 수 있는 자리</dt>
                  <dd>
                    {slots
                      .filter((place) =>
                        (place.accepts as readonly string[]).includes(item.category),
                      )
                      .map((place) => place.name)
                      .join(" · ")}
                  </dd>
                </dl>
                {item.earned ? (
                  <>
                    <details>
                      <summary>연결된 기록 미리보기 · 예시</summary>
                      <p>{item.record}</p>
                    </details>
                    <button
                      type="button"
                      className={styles.primary}
                      onClick={() =>
                        startEdit(
                          slots.find((place) =>
                            (place.accepts as readonly string[]).includes(item.category),
                          )!.id,
                        )
                      }
                    >
                      이 물건 놓으러 가기 →
                    </button>
                    {Object.values(placed).includes(item.id) && (
                      <button
                        type="button"
                        className={styles.clear}
                        onClick={() => {
                          setPlaced(
                            (current) =>
                              Object.fromEntries(
                                Object.entries(current).map(([key, val]) => [
                                  key,
                                  val === item.id ? null : val,
                                ]),
                              ) as Arrangement,
                          );
                          setMessage(
                            `${item.name}을 수집함에 보관했어요. 언제든 다시 놓을 수 있어요.`,
                          );
                        }}
                      >
                        공간에서 빼고 보관하기
                      </button>
                    )}
                  </>
                ) : (
                  <p className={styles.lockNote}>
                    다음 여정에서 만날 물건이에요. 실제 학습 보상은 아직 연결되지 않았어요.
                  </p>
                )}
              </>
            )}
          </aside>
        </div>
      )}
      <footer className={styles.connection}>
        <span>CLASS WORLD → MY WORKSPACE</span>
        <p>
          지도에서 만난 물건이 작업실의 수집품으로 이어져요. 픽셀 세계와 홈은 같은 이름·표식으로
          연결할 예정이에요.
        </p>
        <small>기본 소품은 처음부터 제공 · 같은 물건 중복 지급 없음 · 쉬어도 수집품 유지</small>
      </footer>
    </section>
  );
}
