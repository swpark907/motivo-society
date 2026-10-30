"use client";

// 작업실 모달 위의 수령 확인. native dialog로 포커스와 Escape를 분리한다.
import { useEffect, useRef } from "react";
import { roomRewards, type RoomRewardId } from "@/lib/workbook-room-rewards";
import { slotItems } from "@/lib/workbook-room-slots";
import { RoomArt } from "./WorkbookRoomScene";
import styles from "./WorkbookRewardReceived.module.scss";

export function WorkbookRewardReceived({
  id,
  placementHint,
  onPlace,
  onKeep,
}: {
  id: RoomRewardId;
  placementHint: string;
  onPlace: () => void;
  onKeep: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reward = roomRewards.find((entry) => entry.id === id)!;
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  function finish(action: () => void) {
    dialog.current?.close();
    action();
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="received-item-title"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        finish(onKeep);
      }}
    >
      <p className={styles.eyebrow}>나의 수집품에 추가했어요</p>
      <div className={styles.art} role="img" aria-label={`${slotItems[id]} 크게 보기`}>
        <RoomArt id={id} thumbnail />
      </div>
      <h3 id="received-item-title">{slotItems[id]} 수집 완료</h3>
      <p className={styles.unit}>{reward.unit}</p>
      <p>{reward.meaning}</p>
      <p className={styles.hint}>
        {placementHint} 배치는 미리보기로 반영하고, ‘배치 저장’을 누르면 보관돼요.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={() => finish(onPlace)}>
          작업실에 놓기
        </button>
        <button type="button" onClick={() => finish(onKeep)}>
          수집함에 보관
        </button>
      </div>
    </dialog>
  );
}
