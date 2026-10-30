import type { SlotItem } from "./workbook-room-slots";

// 획득 조건과 수집함 설명의 정본. 실제 제작과 학습용 예시 완료를 구별한다.
export const roomRewards = [
  {
    id: "laptop",
    stage: "project",
    unit: "기획하고 첫 화면 만들기",
    condition: "컴퓨터로 ‘기획하고 첫 화면 만들기’ 단원을 완료해요. 예시 복습은 제외해요.",
    meaning: "첫 홈페이지를 직접 만든 기록을 책상 위에 남겨요.",
  },
  {
    id: "print",
    stage: "experience",
    unit: "반응형 화면 만들기",
    condition: "문제 관찰 → 개선 요청 → PC·모바일 전후 비교를 마치고 단원을 완료해요.",
    meaning: "화면의 배치와 여백을 다듬은 경험을 벽에 걸어요. 학습용 예시 비교도 포함해요.",
  },
  {
    id: "radio",
    stage: "data",
    unit: "기능과 데이터 저장",
    condition:
      "입력·버튼 반응과 저장 전후를 살펴보고, 다른 기기에 서버가 필요한 이유를 기록한 뒤 단원을 완료해요.",
    meaning:
      "조작에 따라 반응하는 라디오로 입력과 동작의 연결을 기억해요. 학습용 시뮬레이션 완료 기념이에요.",
  },
  {
    id: "bonsai",
    stage: "publish",
    unit: "배포하고 고치기",
    condition: "공개 전 점검 → 주소 확인 → 문제 기록·수정 전후 확인을 마치고 단원을 완료해요.",
    meaning:
      "공개 후에도 살피고 다듬는 일을 작은 나무를 돌보는 모습으로 남겨요. 학습용 예시 완료도 포함해요.",
  },
] as const satisfies readonly {
  id: SlotItem;
  stage: string;
  unit: string;
  condition: string;
  meaning: string;
}[];
export type RoomRewardId = (typeof roomRewards)[number]["id"];
export type RoomRewardProgress = {
  projectCompleted: boolean;
  projectMode: string | null;
  experienceCompleted: boolean;
  dataCompleted: boolean;
  publishCompleted: boolean;
};
export function eligibleRoomRewards(progress: RoomRewardProgress): RoomRewardId[] {
  return roomRewards
    .filter(({ id }) =>
      id === "laptop"
        ? progress.projectCompleted && progress.projectMode === "computer"
        : id === "print"
          ? progress.experienceCompleted
          : id === "radio"
            ? progress.dataCompleted
            : progress.publishCompleted,
    )
    .map(({ id }) => id);
}
