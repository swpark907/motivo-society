import type { ApplicationReview } from "./workbook-application-result";

export const applicationStages = {
  project: {
    name: "기획하고 첫 화면 만들기",
    task: "index.html로 첫 화면을 만들고 제목·내용·버튼을 확인",
  },
  experience: {
    name: "반응형 화면 만들기",
    task: "내 파일의 화면 배치를 필요한 부분만 고치고 작은 화면과 넓은 화면에서 확인",
  },
  data: {
    name: "기능과 데이터 저장",
    task: "내 페이지에 필요한 버튼의 입력·표시 동작을 확인하고, 값이 남아야 하는 범위를 판단",
  },
  publish: {
    name: "배포하고 고치기",
    task: "공개 전 내용·버튼·개인정보를 확인하고, 이미 공개했다면 다른 기기에서 같은 주소를 열어 확인",
  },
} as const;
export type ApplicationStage = keyof typeof applicationStages;
export type ApplicationRecord = {
  mode: "pending" | "applied" | null;
  result: string;
  problem: string;
  request: string;
  evidence: string;
  location: string;
  confirmed: boolean;
  review?: ApplicationReview;
};
export const emptyApplications = (): Record<ApplicationStage, ApplicationRecord> =>
  Object.fromEntries(
    Object.keys(applicationStages).map((key) => [
      key,
      {
        mode: null,
        result: "",
        problem: "",
        request: "",
        evidence: "",
        location: "",
        confirmed: false,
      },
    ]),
  ) as Record<ApplicationStage, ApplicationRecord>;
export function applicationStatus(record: ApplicationRecord) {
  return record.mode === null
    ? "적용 여부 미기록"
    : record.mode === "pending"
      ? "아직 직접 적용 전"
      : record.review?.outcome === "waiting" &&
          Object.entries(record.review.values).every(
            ([key, value]) => record[key as keyof ApplicationReview["values"]] === value,
          )
        ? "남은 문제 기록 · 본인 확인"
        : record.confirmed
          ? "직접 적용·확인 · 본인 기록"
          : "적용 기록 작성 중 · 확인 전";
}

// 직접 적용은 학습 완료와 별개이며 확인 전 초안을 완료로 세지 않는다.
export function applicationProgress(records: Record<ApplicationStage, ApplicationRecord>) {
  const stages = Object.keys(applicationStages) as ApplicationStage[];
  const confirmed = stages.filter(
    (stage) => records[stage].mode === "applied" && records[stage].confirmed,
  );
  return { confirmed, pending: stages.filter((stage) => !confirmed.includes(stage)) };
}
