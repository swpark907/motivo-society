"use client";

// 레이어 합성과 pointer capture로 마우스/터치 배치를 시험한다. 실제 보상·회원 저장과는 분리한다.
import Image from "next/image";
import { useRef, useState, type PointerEvent, type CSSProperties } from "react";
import {
  adjustRoomPlacement,
  defaultRoomLayout,
  roomObjects,
  type RoomObjectId,
  type RoomPlacement,
} from "@/lib/workbook-room-layout";
import styles from "./WorkbookLayeredRoom.module.scss";
const root = "/images/workbook/room/layers/";
const actions = [
  { id: "work", label: "작업하기", left: 47, top: 27, width: 18, iw: 1374, ih: 1145 },
  { id: "read", label: "책 읽기", left: 43, top: 57, width: 16, iw: 1284, ih: 1225 },
  { id: "rest", label: "낮잠 자기", left: 32, top: 67, width: 22, iw: 1536, ih: 1024 },
] as const;
export function WorkbookLayeredRoom() {
  const [saved, setSaved] = useState(defaultRoomLayout);
  const [draft, setDraft] = useState(defaultRoomLayout);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<RoomObjectId>("notebook");
  const [action, setAction] = useState<(typeof actions)[number]["id"]>("work");
  const [furniture, setFurniture] = useState(true);
  const [zoom, setZoom] = useState(false);
  const [message, setMessage] = useState("");
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: RoomObjectId;
    pointer: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const arrangeButton = useRef<HTMLButtonElement>(null);
  const controlTitle = useRef<HTMLHeadingElement>(null);
  const layout = editing ? draft : saved;
  const item = layout.find((entry) => entry.id === selected)!;
  const sprite = actions.find((entry) => entry.id === action)!;
  function update(id: RoomObjectId, patch: Partial<RoomPlacement>) {
    setDraft((current) =>
      current.map((entry) => (entry.id === id ? adjustRoomPlacement(entry, patch) : entry)),
    );
  }
  function begin() {
    setDraft(saved.map((entry) => ({ ...entry })));
    setEditing(true);
    requestAnimationFrame(() => controlTitle.current?.focus());
    setMessage("배치할 물건을 선택하세요. 물건을 끌거나 아래 조정 버튼을 사용할 수 있어요.");
  }
  function finish(save: boolean) {
    if (save) setSaved(draft.map((entry) => ({ ...entry })));
    setEditing(false);
    setMessage(
      save
        ? "배치를 저장했어요. 이 화면을 닫고 다시 열어도 이번 방문 동안 유지돼요."
        : "변경을 취소하고 이전 배치로 돌아왔어요.",
    );
    requestAnimationFrame(() => arrangeButton.current?.focus());
  }
  function pointerDown(event: PointerEvent<HTMLButtonElement>, entry: RoomPlacement) {
    setSelected(entry.id);
    if (!editing) return;
    const bounds = canvas.current!.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: entry.id,
      pointer: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: entry.x,
      y: entry.y,
      width: bounds.width,
      height: bounds.height,
    };
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const moving = drag.current;
    if (!moving || moving.pointer !== event.pointerId) return;
    update(moving.id, {
      x: moving.x + ((event.clientX - moving.startX) / moving.width) * 100,
      y: moving.y + ((event.clientY - moving.startY) / moving.height) * 100,
    });
  }
  function stop(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return (
    <section className={styles.room} data-editing={editing} aria-labelledby="layered-room-title">
      <header className={styles.heading}>
        <div>
          <span>LAYERED ROOM / 조작 시안</span>
          <h3 id="layered-room-title">카피바라의 하루, 내가 꾸미는 방.</h3>
        </div>
        <div>
          <button type="button" aria-pressed={zoom} onClick={() => setZoom((value) => !value)}>
            {zoom ? "방 전체 보기" : "확대해서 배치"}
          </button>
          {!editing && (
            <button type="button" ref={arrangeButton} onClick={begin}>
              소품 배치하기
            </button>
          )}
        </div>
      </header>
      <div className={styles.toolbar} aria-label="카피바라 액션">
        {actions.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={action === entry.id}
            onClick={() => setAction(entry.id)}
          >
            {entry.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={furniture}
          onClick={() => setFurniture((value) => !value)}
        >
          가구 {furniture ? "숨겨보기" : "보이기"}
        </button>
      </div>
      <div className={styles.studio}>
        <div
          className={styles.scroll}
          tabIndex={0}
          aria-label="작업실 배치 화면. 확대 시 좌우로 스크롤할 수 있어요."
        >
          <div ref={canvas} className={styles.canvas} data-zoom={zoom} data-editing={editing}>
            <Image
              className={styles.background}
              src={root + "room-base-v1.png"}
              alt="햇빛이 드는 창과 나무 바닥, 러그가 있는 방 배경"
              width={1536}
              height={1024}
              sizes="(min-width: 1024px) 1200px, 100vw"
              draggable={false}
            />
            {furniture && (
              <Image
                className={styles.furniture}
                src={root + "furniture-v1.png"}
                alt="분리된 책상·의자·선반·화분 가구 레이어"
                fill
                sizes="(min-width: 1024px) 1200px, 100vw"
                draggable={false}
              />
            )}
            <div
              className={styles.capy}
              data-action={action}
              style={{ left: `${sprite.left}%`, top: `${sprite.top}%`, width: `${sprite.width}%` }}
            >
              <Image
                src={root + `capy-${action}-v1.png`}
                alt={`카피바라 ${sprite.label} 액션`}
                width={sprite.iw}
                height={sprite.ih}
                sizes="240px"
                draggable={false}
              />
            </div>
            {layout
              .filter((entry) => entry.visible)
              .map((entry) => {
                const object = roomObjects.find((object) => object.id === entry.id)!;
                return (
                  <button
                    type="button"
                    key={entry.id}
                    className={styles.placed}
                    aria-label={`${object.name} 선택`}
                    aria-pressed={entry.id === selected}
                    style={
                      {
                        left: `${entry.x}%`,
                        top: `${entry.y}%`,
                        width: `${entry.width}%`,
                        zIndex: entry.z,
                        transform: `rotate(${entry.rotation}deg)`,
                      } as CSSProperties
                    }
                    onPointerDown={(event) => pointerDown(event, entry)}
                    onPointerMove={pointerMove}
                    onPointerUp={stop}
                    onPointerCancel={stop}
                    onClick={() => setSelected(entry.id)}
                    onKeyDown={(event) => {
                      if (!editing) return;
                      const delta = event.shiftKey ? 0.2 : 0.5;
                      const changes: Record<string, Partial<RoomPlacement>> = {
                        ArrowLeft: { x: entry.x - delta },
                        ArrowRight: { x: entry.x + delta },
                        ArrowUp: { y: entry.y - delta },
                        ArrowDown: { y: entry.y + delta },
                      };
                      if (changes[event.key]) {
                        event.preventDefault();
                        update(entry.id, changes[event.key]);
                      }
                    }}
                  >
                    <Image
                      src={root + object.file}
                      alt=""
                      width={1536}
                      height={1024}
                      sizes="160px"
                      draggable={false}
                    />
                  </button>
                );
              })}
          </div>
        </div>
        <div className={styles.bottom}>
          <section className={styles.collection} aria-labelledby="room-collection-title">
            <h4 id="room-collection-title">
              수집함 <span>3개 · 예시 지급</span>
            </h4>
            <p>
              {editing
                ? "물건을 고른 뒤 ‘방에 놓기’ 또는 ‘보관하기’를 선택하세요."
                : "소품을 골라 배치 상태를 확인하세요."}
            </p>
            <div className={styles.items}>
              {roomObjects.map((object) => {
                const placement = layout.find((entry) => entry.id === object.id)!;
                return (
                  <button
                    key={object.id}
                    type="button"
                    aria-pressed={selected === object.id}
                    onClick={() => setSelected(object.id)}
                  >
                    <Image src={root + object.file} alt="" width={120} height={80} />
                    <strong>{object.name}</strong>
                    <small>{placement.visible ? "전시 중" : "보관 중"}</small>
                  </button>
                );
              })}
            </div>
            <small className={styles.reason}>
              {roomObjects.find((object) => object.id === selected)!.reason}
            </small>
          </section>
          <aside className={styles.controls} aria-label="소품 위치 조정">
            <h4 ref={controlTitle} tabIndex={-1}>
              {roomObjects.find((object) => object.id === selected)!.name}
            </h4>
            {editing ? (
              <>
                <p>드래그·터치로 이동 / 방향키로 미세 이동 · Shift는 더 작게</p>
                <div className={styles.move} aria-label="미세 이동">
                  {[
                    ["왼쪽", -0.5, 0],
                    ["위", 0, -0.5],
                    ["아래", 0, 0.5],
                    ["오른쪽", 0.5, 0],
                  ].map(([label, x, y]) => (
                    <button
                      type="button"
                      key={label}
                      onClick={() =>
                        update(selected, { x: item.x + Number(x), y: item.y + Number(y) })
                      }
                    >
                      {label} 이동
                    </button>
                  ))}
                </div>
                <label>
                  크기{" "}
                  <input
                    aria-label="소품 크기"
                    type="range"
                    min="3"
                    max="18"
                    step=".25"
                    value={item.width}
                    onChange={(event) => update(selected, { width: Number(event.target.value) })}
                  />
                  <output>{item.width.toFixed(1)}%</output>
                </label>
                <label>
                  방향{" "}
                  <input
                    aria-label="소품 회전"
                    type="range"
                    min="-30"
                    max="30"
                    value={item.rotation}
                    onChange={(event) => update(selected, { rotation: Number(event.target.value) })}
                  />
                  <output>{item.rotation}°</output>
                </label>
                <div className={styles.move}>
                  <button type="button" onClick={() => update(selected, { z: item.z + 1 })}>
                    앞으로
                  </button>
                  <button type="button" onClick={() => update(selected, { z: item.z - 1 })}>
                    뒤로
                  </button>
                  <button
                    type="button"
                    onClick={() => update(selected, { visible: !item.visible })}
                  >
                    {item.visible ? "수집함에 보관" : "방에 놓기"}
                  </button>
                </div>
                <small>
                  위치 {item.x.toFixed(1)} · {item.y.toFixed(1)} / 겹침 {item.z}
                </small>
              </>
            ) : (
              <p>
                현재 위치 {item.x.toFixed(1)} · {item.y.toFixed(1)}
                <br />
                ‘소품 배치하기’를 눌러 자유롭게 옮겨보세요.
              </p>
            )}
          </aside>
        </div>
      </div>
      {editing && (
        <div className={styles.savebar}>
          <span>변경 내용을 미리 보고 있어요.</span>
          <button type="button" onClick={() => finish(false)}>
            배치 취소
          </button>
          <button type="button" onClick={() => finish(true)}>
            배치 저장
          </button>
        </div>
      )}
      <p className={styles.message} role="status">
        {message ||
          "방·가구·캐릭터·소품이 각각 분리되어 있어요. 새로고침하면 예시 배치로 돌아가요."}
      </p>
      <p className={styles.scope}>
        AI 생성 레이어 시안 · 가구는 현재 한 묶음이며, 수집 소품 3개는 개별 배치할 수 있어요. 액션은
        각각 독립된 정지 장면으로 전환하며 자동 재생하지 않아요. 실제 회원 진도·보상과는 연결하지
        않았어요.
      </p>
    </section>
  );
}
