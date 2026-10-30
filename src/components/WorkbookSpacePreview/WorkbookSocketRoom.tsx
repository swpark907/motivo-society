"use client";

// 고정 위치 수집품 선택·미리보기·방문 중 저장을 위한 클라이언트 상태.
import { useEffect, useRef, useState } from "react";
import {
  roomActivities,
  roomSlots,
  slotItems,
  type SlotId,
  type SlotItem,
  type RoomActivity,
} from "@/lib/workbook-room-slots";
import {
  canPlaceRoomItem,
  roomItemCompatibility,
  roomThemes,
  roomViews,
  sameRoomWorkspace,
  type RoomTheme,
  type RoomView,
  type RoomWorkspace,
} from "@/lib/workbook-room-catalog";
import { RoomArt, WorkbookRoomScene } from "./WorkbookRoomScene";
import styles from "./WorkbookSocketRoom.module.scss";
import { useWorkbookRoom } from "./WorkbookRoomProvider";
import { WorkbookRewardReceived } from "./WorkbookRewardReceived";
import { roomRewards, type RoomRewardId } from "@/lib/workbook-room-rewards";
import { ownRoomItem, roomRewardAvailable } from "@/lib/workbook-room-collection";
import Link from "next/link";

export function WorkbookSocketRoom({
  slot,
  onSlotChange: setSlot,
  saved,
  onSave,
  activity,
  onActivityChange,
}: {
  slot: SlotId;
  onSlotChange: (slot: SlotId) => void;
  saved: RoomWorkspace;
  onSave: (workspace: RoomWorkspace) => void;
  activity: RoomActivity;
  onActivityChange: (activity: RoomActivity) => void;
}) {
  const { collection, status: storageStatus, claim } = useWorkbookRoom();
  const [inspection, setInspection] = useState<{ id: SlotItem; sequence: number } | null>(null);
  const basicInfo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!inspection) return;
    const target = document.getElementById(`room-reward-${inspection.id}`) ?? basicInfo.current;
    target?.scrollIntoView({ block: "center" });
    target?.focus({ preventScroll: true });
  }, [inspection]);
  function inspectItem(id: SlotItem) {
    const destination = roomSlots.find((entry) => (entry.items as readonly string[]).includes(id))!;
    setSlot(destination.id);
    setPlaced(null);
    setInspection((value) => ({ id, sequence: (value?.sequence ?? 0) + 1 }));
  }
  const placementSequence = useRef(0);
  const [placed, setPlaced] = useState<{ id: SlotItem; theme: RoomTheme; sequence: number } | null>(
    null,
  );
  function markPlacement(id: SlotItem, targetTheme: RoomTheme) {
    setPlaced({ id, theme: targetTheme, sequence: ++placementSequence.current });
  }
  useEffect(() => {
    if (!placed) return;
    const timer = window.setTimeout(() => setPlaced(null), 3500);
    return () => window.clearTimeout(timer);
  }, [placed]);
  const [received, setReceived] = useState<RoomRewardId | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState(saved);
  const theme = workspace.theme;
  const draft = workspace.rooms[theme].layout;
  const view = workspace.rooms[theme].view;
  function showItemInRoom(id: SlotItem) {
    if (!Object.values(draft).includes(id)) return;
    markPlacement(id, theme);
    setStatus(`${slotItems[id]}의 위치를 보여드려요. 배치는 그대로예요.`);
    sceneRef.current?.scrollIntoView({ block: "start" });
    sceneRef.current?.focus({ preventScroll: true });
  }
  function storeItem(id: SlotItem) {
    if (draft[slot] !== id) return;
    updateItem(null);
    setInspection((value) => ({ id, sequence: (value?.sequence ?? 0) + 1 }));
    setStatus(
      `${slotItems[id]}를 수집함에 보관했어요. 물건은 계속 보유하며 ‘변경 취소’로 원래 배치를 되돌릴 수 있어요.`,
    );
  }
  function updateItem(id: SlotItem | null) {
    if (id && (!canPlaceRoomItem(id, theme) || !ownRoomItem(collection, id))) return;
    setInspection(null);
    if (id) {
      markPlacement(id, theme);
      sceneRef.current?.scrollIntoView({ block: "start" });
      sceneRef.current?.focus({ preventScroll: true });
    } else setPlaced(null);
    setWorkspace((value) => ({
      ...value,
      rooms: {
        ...value.rooms,
        [theme]: { ...value.rooms[theme], layout: { ...value.rooms[theme].layout, [slot]: id } },
      },
    }));
  }
  const [status, setStatus] = useState("");
  const current = roomSlots.find((entry) => entry.id === slot)!;
  const dirty = !sameRoomWorkspace(workspace, saved);
  function keepReceived() {
    if (!received) return;
    const id = received;
    setReceived(null);
    setStatus(`${slotItems[id]}를 수집함에 보관했어요. 원할 때 꺼내 놓을 수 있어요.`);
    document.getElementById(`room-reward-${id}`)?.focus({ preventScroll: true });
  }
  function placeReceived() {
    if (!received || !ownRoomItem(collection, received)) return;
    const id = received;
    const destination = roomSlots.find((entry) => (entry.items as readonly string[]).includes(id))!;
    const targetTheme = canPlaceRoomItem(id, theme) ? theme : roomItemCompatibility[id][0];
    setWorkspace((value) => ({
      ...value,
      theme: targetTheme,
      rooms: {
        ...value.rooms,
        [targetTheme]: {
          ...value.rooms[targetTheme],
          layout: { ...value.rooms[targetTheme].layout, [destination.id]: id },
        },
      },
    }));
    setInspection(null);
    markPlacement(id, targetTheme);
    setSlot(destination.id);
    setReceived(null);
    setStatus(
      `${slotItems[id]}를 ${destination.name}에 미리 놓았어요. 마음에 들면 ‘배치 저장’을 눌러주세요.`,
    );
    sceneRef.current?.scrollIntoView({ block: "start" });
    sceneRef.current?.focus({ preventScroll: true });
  }
  return (
    <section className={styles.room} aria-labelledby="socket-room-title">
      <header className={styles.heading}>
        <div>
          <small>MY LITTLE STUDIO</small>
          <h3 id="socket-room-title">취향을 하나씩, 나의 작업실.</h3>
        </div>
        <p>물건을 고르면 어울리는 자리에 놓여요.</p>
      </header>
      <div className={styles.environment}>
        <label>
          방 테마
          <select
            aria-label="방 테마"
            value={theme}
            onChange={(event) => {
              setPlaced(null);
              setInspection(null);
              setWorkspace((value) => ({ ...value, theme: event.target.value as RoomTheme }));
              setStatus("테마마다 꾸민 배치를 따로 기억해요.");
            }}
          >
            {Object.entries(roomThemes).map(([id, entry]) => (
              <option key={id} value={id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          창밖 풍경
          <select
            aria-label="창밖 풍경"
            value={view}
            onChange={(event) => {
              const next = event.target.value as RoomView;
              setWorkspace((value) => ({
                ...value,
                rooms: { ...value.rooms, [theme]: { ...value.rooms[theme], view: next } },
              }));
            }}
          >
            {Object.entries(roomViews).map(([id, entry]) => (
              <option key={id} value={id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <small>{roomThemes[theme].description} · 같은 낮 조명을 사용해요.</small>
      </div>
      <div className={styles.layout}>
        <div
          className={styles.sceneArea}
          ref={sceneRef}
          tabIndex={-1}
          role="region"
          aria-label="작업실 배치 미리보기"
        >
          <WorkbookRoomScene
            workspace={workspace}
            activity={activity}
            highlight={placed?.theme === theme ? placed.id : undefined}
            highlightSequence={placed?.sequence}
            onItemSelect={inspectItem}
          />
          <div className={styles.activities} aria-label="카피바라의 하루">
            {roomActivities.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={activity === entry.id}
                onClick={() => onActivityChange(entry.id)}
              >
                {entry.name}
              </button>
            ))}
          </div>
          <p className={styles.note}>
            방의 물건을 누르면 수집함에서 이름과 획득 활동을 볼 수 있어요. 카피바라의 하루는 세 개의
            정지 장면으로 보여드려요.
          </p>
        </div>
        <aside className={styles.collection} aria-label="작업실 수집함">
          <header>
            <h4>수집함</h4>
            <small>{Object.keys(slotItems).length}개 · 체험용 소품</small>
            <button
              className={styles.backToRoom}
              type="button"
              onClick={() => sceneRef.current?.scrollIntoView({ block: "start" })}
            >
              방 보기 ↑
            </button>
          </header>
          <div className={styles.slots} aria-label="꾸밀 자리">
            {roomSlots.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={slot === entry.id}
                onClick={() => {
                  setInspection(null);
                  setSlot(entry.id);
                }}
              >
                {entry.name}
                <span>{draft[entry.id] ? "●" : "○"}</span>
              </button>
            ))}
          </div>
          <h5>{current.name}</h5>
          <p>{current.hint}</p>
          {inspection &&
            !roomRewards.some((reward) => reward.id === inspection.id) &&
            (current.items as readonly string[]).includes(inspection.id) && (
              <div
                ref={basicInfo}
                className={styles.collectionNote}
                role="region"
                aria-label={`${slotItems[inspection.id]} 수집 안내`}
                tabIndex={-1}
              >
                <strong>{slotItems[inspection.id]}</strong>
                <p>
                  <b>기본 제공 물품</b>
                  <br />
                  작업실을 처음 열면 함께 제공되는 물건이에요. 별도의 활동 없이 사용할 수 있어요.
                </p>
                <small>
                  {draft[slot] === inspection.id
                    ? "지금 방에 놓여 있어요. 아래에서 다른 물건으로 바꾸거나 비워둘 수 있어요."
                    : "수집함에 보관 중이에요. 원할 때 아래에서 골라 다시 놓을 수 있어요."}
                </small>
                {draft[slot] === inspection.id && (
                  <div className={styles.infoActions}>
                    <button type="button" onClick={() => showItemInRoom(inspection.id)}>
                      방에서 보기
                    </button>
                    <button type="button" onClick={() => storeItem(inspection.id)}>
                      수집함에 보관
                    </button>
                  </div>
                )}
              </div>
            )}
          {roomRewards
            .filter((reward) => (current.items as readonly string[]).includes(reward.id))
            .map((reward) => {
              const owned = ownRoomItem(collection, reward.id);
              const available = roomRewardAvailable(collection, reward.id);
              return (
                <div
                  key={reward.id}
                  id={`room-reward-${reward.id}`}
                  className={styles.collectionNote}
                  role="region"
                  aria-label={`${slotItems[reward.id]} 수집 안내`}
                  tabIndex={-1}
                >
                  <strong>
                    {slotItems[reward.id]} ·{" "}
                    {owned ? "수집 완료" : available ? "받을 수 있어요" : "활동 수집품"}
                  </strong>
                  <p>
                    <b>{reward.unit}</b>
                    <br />
                    {reward.condition}
                  </p>
                  <p>{reward.meaning}</p>
                  {reward.id === "bonsai" && (
                    <small>나무 작업실의 바닥 한쪽에 놓을 수 있어요.</small>
                  )}
                  {draft[slot] === reward.id && (
                    <div className={styles.infoActions}>
                      <button type="button" onClick={() => showItemInRoom(reward.id)}>
                        방에서 보기
                      </button>
                      <button type="button" onClick={() => storeItem(reward.id)}>
                        수집함에 보관
                      </button>
                    </div>
                  )}
                  {available && !owned ? (
                    <button
                      type="button"
                      onClick={() => {
                        claim(reward.id);
                        setReceived(reward.id);
                      }}
                    >
                      {slotItems[reward.id]} 받기
                    </button>
                  ) : !owned ? (
                    <Link href="/workbook/classes/vibe-web">클래스에서 활동 살펴보기 →</Link>
                  ) : (
                    <small>보유한 물건은 계속 사용할 수 있어요.</small>
                  )}
                </div>
              );
            })}
          <div className={styles.items}>
            {current.items.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={draft[slot] === id}
                disabled={!canPlaceRoomItem(id, theme) || !ownRoomItem(collection, id)}
                onClick={() => {
                  updateItem(id);
                  setStatus(`${slotItems[id]}를 ${current.name}에 놓았어요.`);
                }}
              >
                <span className={styles.swatch}>
                  <RoomArt id={id} thumbnail />
                </span>
                <strong>{slotItems[id]}</strong>
                <small>
                  {!ownRoomItem(collection, id)
                    ? roomRewards.some(
                        (reward) => reward.id === id && roomRewardAvailable(collection, reward.id),
                      )
                      ? "받은 뒤 배치할 수 있어요"
                      : "활동을 마치면 수집"
                    : !canPlaceRoomItem(id, theme)
                      ? "나무 작업실에서 사용"
                      : draft[slot] === id
                        ? "배치 중"
                        : "선택해서 놓기"}
                </small>
              </button>
            ))}
            <button
              type="button"
              aria-pressed={draft[slot] === null}
              onClick={() => {
                updateItem(null);
                setStatus(`${current.name}의 물건을 수집함에 보관했어요.`);
              }}
            >
              <span className={styles.swatch}>—</span>
              <strong>비워두기</strong>
              <small>수집함에 보관</small>
            </button>
          </div>
          <p className={styles.note}>
            아이디어 노트·머그·해 질 녘 액자·고무나무·쿠션은 기본 제공이에요. 자리마다 하나씩 놓을
            수 있어요. 다른 물건을 고르면 기존 물건은 수집함으로 돌아와요.
          </p>
        </aside>
      </div>
      <footer className={styles.savebar}>
        <span>{dirty ? "바꾼 배치를 미리 보고 있어요." : "배치를 이 브라우저에 저장해요."}</span>
        <button
          type="button"
          disabled={!dirty}
          onClick={() => {
            setPlaced(null);
            setInspection(null);
            setWorkspace(saved);
            setStatus("저장한 배치로 돌아왔어요.");
          }}
        >
          변경 취소
        </button>
        <button
          type="button"
          disabled={!dirty}
          onClick={() => {
            onSave(workspace);
            setStatus("작업실 배치를 적용했어요.");
          }}
        >
          배치 저장
        </button>
      </footer>
      <p role="status" className={styles.note}>
        {status || "물건을 골라 작업실을 꾸며보세요."}
      </p>
      <p className={styles.note}>
        {storageStatus === "ready"
          ? "이 브라우저에 배치·행동·수집품을 저장해요. 회원 계정·다른 기기와 동기화하지 않아요. 체험 수집품은 서버가 검증한 보상이 아니에요."
          : storageStatus === "invalid"
            ? "기존 작업실 저장을 읽지 못해 기본 배치를 보여줘요. 다시 저장하면 새 배치를 보관해요."
            : "브라우저 저장을 사용할 수 없어 이번 방문 동안만 유지해요."}
      </p>
      {received && (
        <WorkbookRewardReceived
          id={received}
          placementHint={
            canPlaceRoomItem(received, theme)
              ? "이 방의 정해진 자리에 놓아볼까요?"
              : `${roomThemes[roomItemCompatibility[received][0]].name}로 전환해 놓아요. 현재 방의 배치는 유지돼요.`
          }
          onPlace={placeReceived}
          onKeep={keepReceived}
        />
      )}
    </section>
  );
}
