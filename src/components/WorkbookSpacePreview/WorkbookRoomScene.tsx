import { WorkbookRoomImage } from "./WorkbookRoomImage";
import {
  roomActivities,
  roomArt,
  roomSlots,
  slotItems,
  type RoomActivity,
  type SlotItem,
} from "@/lib/workbook-room-slots";
import {
  furnitureAssets,
  roomObjectResource,
  roomThemes,
  roomViews,
  type RoomWorkspace,
} from "@/lib/workbook-room-catalog";
import styles from "./WorkbookSocketRoom.module.scss";

export function RoomArt({
  id,
  thumbnail = false,
}: {
  id: keyof typeof roomArt;
  thumbnail?: boolean;
}) {
  // 원본 캔버스 기준 배치를 유지하고 서비스용 크롭 이미지를 좌표로 복원한다.
  const {
    box: [bx, by, bw, bh],
    place,
    src,
  } = roomObjectResource(id);
  const width = thumbnail ? Math.min(80, (80 * bw) / bh / 1.5) : place[2];
  const x = thumbnail ? (100 - width) / 2 : place[0];
  const y = thumbnail ? (100 - (width * 1.5 * bh) / bw) / 2 : place[1];
  const scale = width / ((bw / 1536) * 100);
  return (
    <WorkbookRoomImage
      className={styles.layer}
      src={src}

      style={{
        width: `${scale * 100}%`,
        height: "auto",
        position: "absolute",
        left: `${x - (bx / 1536) * scale * 100}%`,
        top: `${y - (by / 1024) * scale * 100}%`,
      }}
    />
  );
}

export function WorkbookRoomScene({
  workspace,
  activity,
  compact = false,
  highlight,
  highlightSequence,
  onItemSelect,
}: {
  workspace: RoomWorkspace;
  activity: RoomActivity;
  compact?: boolean;
  highlight?: SlotItem;
  highlightSequence?: number;
  onItemSelect?: (id: SlotItem) => void;
}) {
  const theme = workspace.theme;
  const draft = workspace.rooms[theme].layout;
  const view = workspace.rooms[theme].view;
  const sets = furnitureAssets(draft, activity, theme);
  const marked = highlight ? roomObjectResource(highlight) : null;
  return (
    <span className={styles.sceneShell}>
      <span
        className={styles.scene}
        data-room-scene={compact ? "home" : "editor"}
        role="img"
        aria-label={`카피바라의 작업실 · ${roomThemes[theme].name} · ${roomViews[view].name} · ${roomActivities.find((entry) => entry.id === activity)!.name} · ${Object.values(
          draft,
        )
          .filter(Boolean)
          .map((id) => slotItems[id!])
          .join(", ")}`}
      >
        <WorkbookRoomImage className={styles.base} src={roomThemes[theme].base} />
        {roomViews[view].file && (
          <WorkbookRoomImage
            key={view}
            className={styles.windowView}
            src={roomViews[view].file!}

            fill
          />
        )}
        <WorkbookRoomImage
          key={sets.desk.src}
          data-room-set={sets.desk.id}
          className={styles.deskSet}
          src={sets.desk.src}

          fill
        />
        <WorkbookRoomImage
          key={sets.lounge.src}
          data-room-set={sets.lounge.id}
          className={styles.loungeSet}
          src={sets.lounge.src}

          fill
        />
        {activity === "rest" && <RoomArt id="rest" />}
        {roomSlots.map(
          (entry) =>
            entry.id !== "lounge" &&
            entry.id !== "desk" &&
            draft[entry.id] && (
              <RoomArt key={`${entry.id}-${draft[entry.id]}`} id={draft[entry.id]!} />
            ),
        )}
        {highlight && marked && (
          <span
            key={highlightSequence ?? highlight}
            aria-hidden="true"
            data-room-highlight={highlight}
            data-edge={marked.place[0] > 75 ? "right" : undefined}
            className={styles.placementMark}
            style={{
              left: `${marked.place[0]}%`,
              top: `${marked.place[1]}%`,
              width: `${marked.place[2]}%`,
              height: `${(marked.place[2] * 1.5 * marked.box[3]) / marked.box[2]}%`,
            }}
          >
            <span className={styles.placementFrame} />
            <span className={styles.placementLabel}>{slotItems[highlight]} · 여기 놓았어요</span>
          </span>
        )}
      </span>
      {onItemSelect && (
        <span role="group" aria-label="방에 놓인 물건">
          {roomSlots.map((entry) => {
            const id = draft[entry.id];
            if (!id) return null;
            const {
              place: [x, y, width],
              box,
            } = roomObjectResource(id);
            const height = (width * 1.5 * box[3]) / box[2];
            return (
              <button
                key={entry.id}
                className={styles.roomItemButton}
                type="button"
                aria-label={`${slotItems[id]} 수집함에서 보기`}
                title={`${slotItems[id]} · 수집함에서 보기`}
                onClick={() => onItemSelect(id)}
                style={{
                  left: `${x + width / 2}%`,
                  top: `${y + height / 2}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                }}
              />
            );
          })}
        </span>
      )}
    </span>
  );
}
