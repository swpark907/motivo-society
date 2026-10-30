"use client";

// 브라우저 보유 상태와 클릭한 수집품의 확대 화면을 연결한다.
import { useState } from "react";
import { useWorkbookRoom } from "@/components/WorkbookSpacePreview/WorkbookRoomProvider";
import { ownRoomItem, roomRewardAvailable } from "@/lib/workbook-room-collection";
import { WorkbookCollectibleDetail } from "./WorkbookCollectibleDetail";
import Link from "next/link";
import { roomRewards, type RoomRewardId } from "@/lib/workbook-room-rewards";
import { slotItems } from "@/lib/workbook-room-slots";
import { RoomArt } from "@/components/WorkbookSpacePreview/WorkbookRoomScene";
import styles from "./WorkbookClassCollectibles.module.scss";

export function WorkbookClassCollectibles({
  onActivity,
}: {
  onActivity: (id: RoomRewardId) => void;
}) {
  const { collection } = useWorkbookRoom();
  const [selected, setSelected] = useState<RoomRewardId | null>(null);
  return (
    <section className={styles.section} aria-labelledby="class-collectibles-title">
      <h2 id="class-collectibles-title">학습의 기록을 작업실에도 남겨요</h2>
      <p>단원을 마친 기록으로 작은 물건이 남아요. 원한다면 내 작업실에 놓아둘 수 있어요.</p>
      <details>
        <summary>작업실에 남는 물건 살펴보기</summary>
        <ul className={styles.list}>
          {roomRewards.map((reward) => (
            <li key={reward.id}>
              <div className={styles.header}>
                <span className={styles.art}>
                  <RoomArt id={reward.id} thumbnail />
                </span>
                <div>
                  <small>{reward.unit}</small>
                  <h3>{slotItems[reward.id]}</h3>
                </div>
              </div>
              <p>{reward.condition}</p>
              {reward.id === "bonsai" && <small>나무 작업실의 바닥 한쪽에 놓을 수 있어요.</small>}
              <small className={styles.state}>
                {ownRoomItem(collection, reward.id)
                  ? "보유 중"
                  : roomRewardAvailable(collection, reward.id)
                    ? "받을 수 있어요"
                    : "아직 수집 전"}{" "}
                · 크게 보기 ↗
              </small>
              <button
                className={styles.open}
                type="button"
                aria-label={`${slotItems[reward.id]} 크게 보기`}
                aria-haspopup="dialog"
                onClick={() => setSelected(reward.id)}
              />
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          첫 노트북은 컴퓨터 제작 실습을 완료한 본인 기록으로 받아요. 나머지 세 물건은 학습용
          예시·시뮬레이션 완료도 포함하는 기념품이에요.
        </p>
        <p className={styles.note}>
          노트·머그·해 질 녘 액자·고무나무·쿠션은 기본 제공이에요. 수집품과 방 배치는 이 브라우저에
          저장되는 체험 기능이며, 회원 계정·다른 기기와 동기화하지 않아요.
        </p>
        <Link href="/workbook#workspace">내 작업실 살펴보기 →</Link>
      </details>
      {selected && (
        <WorkbookCollectibleDetail
          id={selected}
          onClose={() => setSelected(null)}
          onActivity={() => {
            const id = selected;
            setSelected(null);
            onActivity(id);
          }}
        />
      )}
    </section>
  );
}
