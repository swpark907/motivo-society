import type { ApplicationRecord, ApplicationStage } from "./workbook-application";
import { checkpointKeys, type ProgressState } from "./workbook-project-progress";

export type ApplicationReview = {
  context: string;
  outcome: "confirmed" | "waiting";
  values: Pick<ApplicationRecord, "location" | "request" | "result" | "problem" | "evidence">;
};
export const resultFields = ["location", "request", "result", "problem", "evidence"] as const;
export type ApplicationRecords = Record<ApplicationStage, ApplicationRecord>;
export type ConnectedStage = "experience" | "data" | "publish";
export function resultValues(record: ApplicationRecord) {
  return Object.fromEntries(
    resultFields.map((key) => [key, record[key]]),
  ) as ApplicationReview["values"];
}
// 예시 조작은 제외하고 실제 작업 기준과 앞선 적용 기록만 비교한다.
export function applicationResultContext(
  state: ProgressState,
  stage: ConnectedStage,
  plan: string,
  records: ApplicationRecords,
) {
  const upstream: ConnectedStage[] =
    stage === "publish" ? ["experience", "data"] : stage === "data" ? ["experience"] : [];
  return JSON.stringify([
    state.projectId,
    plan,
    checkpointKeys
      .filter((key) => key.startsWith(`${stage}.`))
      .map((key) => [key, state.checkpoints[key].revision]),
    upstream.map((key) => [
      key,
      records[key].mode,
      resultValues(records[key]),
      records[key].review,
    ]),
  ]);
}
export function saveApplicationResult(
  state: ProgressState,
  stage: ConnectedStage,
  plan: string,
  records: ApplicationRecords,
  outcome: ApplicationReview["outcome"],
): ApplicationRecord {
  const record = records[stage];
  if (
    record.mode !== "applied" ||
    !record.result.trim() ||
    !record.problem.trim() ||
    !record.evidence.trim()
  )
    return record;
  return {
    ...record,
    confirmed: outcome === "confirmed",
    review: {
      context: applicationResultContext(state, stage, plan, records),
      outcome,
      values: resultValues(record),
    },
  };
}
export function applicationResultStatus(
  state: ProgressState,
  stage: ConnectedStage,
  plan: string,
  records: ApplicationRecords,
): "confirmed" | "waiting" | "recheck" | null {
  const record = records[stage];
  if (!record.review) return null;
  if (
    record.mode !== "applied" ||
    record.review.context !== applicationResultContext(state, stage, plan, records) ||
    resultFields.some((key) => record[key] !== record.review!.values[key])
  )
    return "recheck";
  if (record.review.outcome === "confirmed") return record.confirmed ? "confirmed" : "recheck";
  return "waiting";
}
