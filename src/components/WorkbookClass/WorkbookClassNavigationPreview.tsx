"use client";
// 독립된 검토용 학습 상태다. 실제 진도·보상을 기록하지 않는다.
import { useState } from "react";
import { WorkbookRoomProvider } from "@/components/WorkbookSpacePreview/WorkbookRoomProvider";
import { emptyExperience } from "@/lib/workbook-experience";
import { emptyProject } from "./WorkbookProjectLesson";
import { WorkbookProgressPreviewProvider, useWorkbookProgress } from "./WorkbookProgressContext";
import { WorkbookClass } from "./WorkbookClass";
const records = { project: emptyProject(), experience: emptyExperience() };
export function WorkbookClassNavigationPreview() {
  return (
    <WorkbookProgressPreviewProvider records={records}>
      <WorkbookRoomProvider eligible={[]}>
        <Preview />
      </WorkbookRoomProvider>
    </WorkbookProgressPreviewProvider>
  );
}
function Preview() {
  const p = useWorkbookProgress();
  const [opened, setOpened] = useState(false);
  if (opened)
    return (
      <div style={{ width: "100%", minWidth: 0 }}>
        <WorkbookClass />
      </div>
    );
  return (
    <button
      onClick={() => {
        p.setProjectCompleted(false);
        p.setExperienceCompleted(false);
        p.setMapWorld("ai");
        p.setLesson(null);
        p.setScene(2);
        p.setPurpose("explore");
        setOpened(true);
      }}
    >
      1단원 완료 후 이동 검토
    </button>
  );
}
