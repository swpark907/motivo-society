"use client";

// 열람 전용 확대 모달. 보유 상태만 읽고 수령·배치·저장을 변경하지 않는다.
import { useEffect, useRef } from "react";
import Link from "next/link";
import { roomRewards, type RoomRewardId } from "@/lib/workbook-room-rewards";
import { slotItems } from "@/lib/workbook-room-slots";
import { ownRoomItem, roomRewardAvailable } from "@/lib/workbook-room-collection";
import { useWorkbookRoom } from "@/components/WorkbookSpacePreview/WorkbookRoomProvider";
import { RoomArt } from "@/components/WorkbookSpacePreview/WorkbookRoomScene";
import styles from "./WorkbookCollectibleDetail.module.scss";

export function WorkbookCollectibleDetail({
  id,
  onClose,
  onActivity,
}: {
  id: RoomRewardId;
  onClose: () => void;
  onActivity: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { collection } = useWorkbookRoom();
  const reward = roomRewards.find((entry) => entry.id === id)!;
  const owned = ownRoomItem(collection, id);
  const available = roomRewardAvailable(collection, id);
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="collectible-detail-title"
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
        <h2 id="collectible-detail-title">{slotItems[id]}</h2>
        <button type="button" aria-label="수집품 확대 닫기" onClick={onClose}>
          닫기 ×
        </button>
      </header>
      <div className={styles.art} role="img" aria-label={`${slotItems[id]} 확대 이미지`}>
        <RoomArt id={id} thumbnail />
      </div>
      <p className={styles.state}>
        {owned ? "보유 중" : available ? "받을 수 있어요" : "아직 수집 전"}
      </p>
      <p>
        {owned
          ? "이 브라우저의 수집함에 보유하고 있어요."
          : available
            ? "수령 가능한 물건이에요. 작업실 수집함에서 받아보세요."
            : "아래 활동을 완료하면 수집함에서 받을 수 있어요."}
      </p>
      <h3>획득 활동 · {reward.unit}</h3>
      <p>{reward.condition}</p>
      <p className={styles.note}>{reward.meaning}</p>
      {id === "bonsai" && <p className={styles.note}>나무 작업실의 바닥 한쪽에 놓을 수 있어요.</p>}
      <p className={styles.note}>
        이 브라우저에 저장된 체험 수집 상태예요. 회원 계정·다른 기기와 동기화하지 않아요.
      </p>
      {!owned && !available ? (
        <button type="button" className={styles.link} onClick={onActivity}>
          이 활동 하러 가기 →
        </button>
      ) : (
        <Link
          className={styles.link}
          href={
            available && !owned ? `/workbook#workspace-collectible-${id}` : "/workbook#workspace"
          }
        >
          {available && !owned ? "수집함에서 받기 →" : "작업실에서 살펴보기 →"}
        </Link>
      )}
    </dialog>
  );
}
