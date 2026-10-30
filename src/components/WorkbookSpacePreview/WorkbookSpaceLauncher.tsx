"use client";

// 홈의 작업실을 연다. 비교 시안은 명시적인 데모 호출에서만 제공한다. 닫아도 이번 방문의 배치 상태는 유지한다.
import { useEffect, useRef, useState } from "react";
import { WorkbookLayeredRoom } from "./WorkbookLayeredRoom";
import { WorkbookSocketRoom } from "./WorkbookSocketRoom";
import { WorkbookRoomScene } from "./WorkbookRoomScene";
import { roomThemes } from "@/lib/workbook-room-catalog";
import { roomRewards, type RoomRewardId } from "@/lib/workbook-room-rewards";
import { ownRoomItem, roomRewardAvailable } from "@/lib/workbook-room-collection";
import { roomActivities, roomSlots, slotItems, type SlotId } from "@/lib/workbook-room-slots";
import { useWorkbookRoom } from "./WorkbookRoomProvider";
import { WorkbookRoomConcept } from "./WorkbookRoomConcept";
import { WorkbookSpacePreview } from "./WorkbookSpacePreview";
import styles from "./WorkbookSpaceLauncher.module.scss";

export function WorkbookSpaceLauncher({ showStudies = false }: { showStudies?: boolean }) {
  const { collection, save: setSaved, setActivity } = useWorkbookRoom();
  const saved = collection.workspace;
  const activity = collection.activity;
  const [open, setOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const [screen, setScreen] = useState<"live" | "free" | "concept" | "structure">("live");
  const [slot, setSlot] = useState<SlotId>("desk");
  const [shortcut, setShortcut] = useState<RoomRewardId | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const waiting = roomRewards.filter(
    ({ id }) => roomRewardAvailable(collection, id) && !ownRoomItem(collection, id),
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function openLinkedCollectible() {
      if (!window.location.hash.startsWith("#workspace-collectible-")) return;
      const id = window.location.hash.slice("#workspace-collectible-".length);
      if (!roomRewards.some((reward) => reward.id === id)) return;
      const rewardId = id as RoomRewardId;
      opener.current = trigger.current;
      setSlot(roomSlots.find((entry) => (entry.items as readonly string[]).includes(rewardId))!.id);
      setShortcut(rewardId);
      setScreen("live");
      setActivated(true);
      setOpen(true);
    }
    const frame = requestAnimationFrame(openLinkedCollectible);
    window.addEventListener("hashchange", openLinkedCollectible);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openLinkedCollectible);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const mainTrigger = trigger.current;
    const triggerElement = opener.current ?? mainTrigger;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    if (shortcut) {
      const target = element?.querySelector<HTMLElement>(`#room-reward-${shortcut}`);
      target?.scrollIntoView({ block: "center" });
      target?.focus({ preventScroll: true });
    }
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      (triggerElement?.isConnected ? triggerElement : mainTrigger)?.focus();
    };
  }, [open, shortcut]);
  return (
    <>
      <div className={styles.launcher}>
        <button
          id="workspace"
          type="button"
          ref={trigger}
          className={styles.card}
          onClick={(event) => {
            opener.current = event.currentTarget;
            setShortcut(null);
            setActivated(true);
            setOpen(true);
          }}
          aria-haspopup="dialog"
        >
          <span className={styles.thumbnail}>
            <WorkbookRoomScene workspace={saved} activity={activity} compact />
          </span>
          <span>
            <small>나의 작업실 · 브라우저 저장</small>
            <strong>카피바라가 기다려요.</strong>
            <span>
              {roomThemes[saved.theme].name} ·{" "}
              {roomActivities.find((entry) => entry.id === activity)!.name}
            </span>
            <span>작업 공간 · 수집함 · 꾸미기 ↗</span>
          </span>
        </button>
        {waiting.length > 0 && (
          <div className={styles.rewards} role="group" aria-label="받을 수 있는 수집품">
            <p aria-live="polite">
              받을 수 있는 수집품 <strong>{waiting.length}개</strong>
            </p>
            {waiting.map(({ id }) => (
              <button
                key={id}
                type="button"
                aria-haspopup="dialog"
                aria-label={`${slotItems[id]} 수집함 열기`}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setSlot(
                    roomSlots.find((entry) => (entry.items as readonly string[]).includes(id))!.id,
                  );
                  setShortcut(id);
                  setScreen("live");
                  setActivated(true);
                  setOpen(true);
                }}
              >
                <span>{slotItems[id]}</span>
                <span aria-hidden="true">받기 →</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="workspace-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
      >
        <header className={styles.header}>
          <div>
            <span>MY WORKSPACE</span>
            <h2 id="workspace-dialog-title">카피바라의 작업실</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)}>
            작업실 닫기 ×
          </button>
        </header>
        {showStudies && (
          <nav className={styles.screens} aria-label="작업실 시안 선택">
            <button
              type="button"
              aria-pressed={screen === "live"}
              onClick={() => setScreen("live")}
            >
              내 작업실 꾸미기
            </button>
            <button
              type="button"
              aria-pressed={screen === "free"}
              onClick={() => setScreen("free")}
            >
              이전 자유 배치
            </button>
            <button
              type="button"
              aria-pressed={screen === "concept"}
              onClick={() => setScreen("concept")}
            >
              새 공간 시안
            </button>
            <button
              type="button"
              aria-pressed={screen === "structure"}
              onClick={() => setScreen("structure")}
            >
              수집·배치 구조
            </button>
          </nav>
        )}
        {activated && (
          <>
            <div hidden={showStudies && screen !== "live"}>
              <WorkbookSocketRoom
                slot={slot}
                onSlotChange={setSlot}
                saved={saved}
                onSave={setSaved}
                activity={activity}
                onActivityChange={setActivity}
              />
            </div>
            {showStudies && (
              <>
                <div hidden={screen !== "free"}>
                  <WorkbookLayeredRoom />
                </div>
                <div hidden={screen !== "concept"}>
                  <WorkbookRoomConcept />
                </div>
                <div hidden={screen !== "structure"}>
                  <p className={styles.notice}>
                    이전 수집·배치 동작 실험입니다. 새 공간 원화의 소품 이동과 연결된 화면은
                    아닙니다.
                  </p>
                  <WorkbookSpacePreview />
                </div>
              </>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
