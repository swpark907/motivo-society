// 후속 화면이 공유할 방문 메모리 상태. 외부 파일·URL 검사와 영속 저장은 하지 않는다.
export const projectStages = ["setup", "project", "experience", "data", "publish"] as const;
export type ProjectStage = (typeof projectStages)[number];
export const learningUnits = [
  "ai-1",
  "ai-2",
  "ai-3",
  "ai-4",
  "ai-5",
  "project",
  "experience",
  "data",
  "publish",
] as const;
export type LearningUnit = (typeof learningUnits)[number];
type LearningRecord = {
  status: "unstarted" | "in-progress" | "confirmed";
  sources: ("example" | "computer")[];
  opened: boolean;
};
export const checkpointKeys = [
  "setup.folder",
  "setup.file",
  "setup.opened",
  "setup.changed",
  "project.plan",
  "project.content",
  "project.actions",
  "experience.observed",
  "experience.request",
  "experience.changed",
  "experience.verified",
  "experience.kept",
  "data.details",
  "data.details-omitted",
  "data.storage",
  "data.storage-omitted",
  "data.scope",
  "publish.materials",
  "publish.terms",
  "publish.deployed",
  "publish.anonymous",
  "publish.device",
  "publish.storage",
  "publish.shared",
  "publish.changed",
  "publish.redeployed",
  "publish.current",
] as const;
export type CheckpointKey = (typeof checkpointKeys)[number];
type Confirmation = { projectId: string; revision: number; evidence: string };
export type Checkpoint = {
  revision: number;
  outcome: "unverified" | "attempted" | "confirmed";
  evidence: string;
  confirmation: Confirmation | null;
  obstacle: string;
};
type Decision<Value extends string> = { value: Value | null; reason: string; projectId: string };
export type ProgressState = {
  projectId: string;
  changes: Partial<Record<ChangeKind, string>>;
  location: string;
  publicUrl: string;
  learning: Record<LearningUnit, LearningRecord>;
  checkpoints: Record<CheckpointKey, Checkpoint>;
  decisions: {
    experience: Decision<"improve" | "keep">;
    details: Decision<"apply" | "omit">;
    storage: Decision<"apply" | "omit">;
  };
  notes: Record<string, { text: string; projectId: string; stage?: ProjectStage }>;
};
export function emptyProjectProgress(projectId = "current"): ProgressState {
  return {
    projectId,
    changes: {},
    location: "",
    publicUrl: "",
    learning: Object.fromEntries(
      learningUnits.map((key): [LearningUnit, LearningRecord] => [
        key,
        { status: "unstarted", sources: [], opened: key === "ai-1" },
      ]),
    ) as ProgressState["learning"],
    checkpoints: Object.fromEntries(
      checkpointKeys.map((key) => [
        key,
        { revision: 0, outcome: "unverified", evidence: "", confirmation: null, obstacle: "" },
      ]),
    ) as ProgressState["checkpoints"],
    decisions: Object.fromEntries(
      ["experience", "details", "storage"].map((key) => [
        key,
        { value: null, reason: "", projectId },
      ]),
    ) as ProgressState["decisions"],
    notes: {},
  };
}
export type ChangeKind =
  | "plan"
  | "content"
  | "layout"
  | "details"
  | "storage"
  | "deployment"
  | "access"
  | "address"
  | "unknown";
const publicChecks: CheckpointKey[] = ["publish.anonymous", "publish.device", "publish.current"];
const localRelease: CheckpointKey[] = ["publish.redeployed", ...publicChecks];
const changeImpact: Record<Exclude<ChangeKind, "unknown">, CheckpointKey[]> = {
  plan: [
    "project.plan",
    "project.content",
    "project.actions",
    "experience.observed",
    "experience.verified",
    "experience.kept",
    "data.details",
    "data.details-omitted",
    "data.storage",
    "data.storage-omitted",
    "data.scope",
    "publish.materials",
    "publish.storage",
    ...localRelease,
  ],
  content: [
    "project.content",
    "project.actions",
    "experience.observed",
    "experience.verified",
    "experience.kept",
    "data.details",
    "data.details-omitted",
    "data.storage-omitted",
    "data.scope",
    "publish.materials",
    ...localRelease,
  ],
  layout: [
    "experience.observed",
    "experience.verified",
    "experience.kept",
    "data.details",
    ...localRelease,
  ],
  details: [
    "experience.observed",
    "experience.verified",
    "experience.kept",
    "data.details",
    ...localRelease,
  ],
  storage: [
    "experience.verified",
    "experience.kept",
    "data.storage",
    "data.storage-omitted",
    "data.scope",
    "publish.storage",
    ...localRelease,
  ],
  deployment: ["publish.storage", ...publicChecks],
  access: ["publish.storage", ...publicChecks],
  address: ["publish.deployed", "publish.shared", "publish.storage", ...publicChecks],
};
export type ProgressAction =
  | {
      type: "learn";
      unit: LearningUnit;
      status: LearningRecord["status"];
      source?: "example" | "computer";
    }
  | { type: "note"; key: string; text: string; stage?: ProjectStage }
  | { type: "decide"; branch: "experience"; value: "improve" | "keep"; reason: string }
  | { type: "decide"; branch: "details" | "storage"; value: "apply" | "omit"; reason: string }
  | {
      type: "record";
      key: CheckpointKey;
      outcome: "attempted" | "confirmed";
      evidence: string;
      projectId: string;
      revision: number;
    }
  | { type: "obstacle"; key: CheckpointKey; reason: string }
  | { type: "change"; values: Partial<Record<ChangeKind, string>> }
  | {
      type: "legacy";
      learned: { unit: LearningUnit; source: "example" | "computer" }[];
      notes: Record<string, string>;
    }
  | { type: "location"; value: string }
  | { type: "address"; value: string }
  | { type: "project"; projectId: string };
function invalidate(state: ProgressState, keys: readonly CheckpointKey[]): ProgressState {
  const checkpoints = { ...state.checkpoints };
  for (const key of new Set(keys))
    checkpoints[key] = { ...checkpoints[key], revision: checkpoints[key].revision + 1 };
  return { ...state, checkpoints };
}
function openLearning(state: ProgressState): ProgressState {
  const learning = { ...state.learning };
  for (let i = 1; i < learningUnits.length; i++) {
    const unit = learningUnits[i];
    if (learning[learningUnits[i - 1]].status === "confirmed" && !learning[unit].opened)
      learning[unit] = { ...learning[unit], opened: true };
  }
  return { ...state, learning };
}
export function projectProgressReducer(
  state: ProgressState,
  action: ProgressAction,
): ProgressState {
  switch (action.type) {
    case "learn": {
      const previous = state.learning[action.unit];
      // 원리 확인을 수정해도 이미 열린 학습은 다시 잠그지 않는다.
      if (
        !previous.opened ||
        (action.status === "confirmed" && !action.source && !previous.sources.length)
      )
        return state;
      const sources =
        action.source && !previous.sources.includes(action.source)
          ? [...previous.sources, action.source]
          : previous.sources;
      if (previous.status === action.status && sources === previous.sources) return state;
      return openLearning({
        ...state,
        learning: {
          ...state.learning,
          [action.unit]: { ...previous, status: action.status, sources },
        },
      });
    }
    case "note": {
      if (
        state.notes[action.key]?.text === action.text &&
        state.notes[action.key]?.projectId === state.projectId &&
        state.notes[action.key]?.stage === action.stage
      )
        return state;
      return {
        ...state,
        notes: {
          ...state.notes,
          [action.key]: { text: action.text, projectId: state.projectId, stage: action.stage },
        },
      };
    }
    case "decide": {
      const previous = state.decisions[action.branch];
      if (
        previous.value === action.value &&
        previous.reason === action.reason &&
        previous.projectId === state.projectId
      )
        return state;
      const keys: CheckpointKey[] =
        action.branch === "experience"
          ? [
              "experience.observed",
              "experience.request",
              "experience.changed",
              "experience.verified",
              "experience.kept",
            ]
          : action.branch === "details"
            ? ["data.details", "data.details-omitted"]
            : ["data.storage", "data.storage-omitted", "data.scope"];
      return {
        ...invalidate(state, keys),
        decisions: {
          ...state.decisions,
          [action.branch]: {
            value: action.value,
            reason: action.reason,
            projectId: state.projectId,
          },
        },
      };
    }
    case "record": {
      const previous = state.checkpoints[action.key];
      // 변경 전 화면에서 늦게 전달된 확인으로 최신 결과를 덮어쓰지 않는다.
      if (action.projectId !== state.projectId || action.revision !== previous.revision)
        return state;
      if (action.outcome === "confirmed" && !action.evidence.trim()) return state;
      const confirmation =
        action.outcome === "confirmed"
          ? { projectId: state.projectId, revision: previous.revision, evidence: action.evidence }
          : previous.confirmation;
      return {
        ...state,
        checkpoints: {
          ...state.checkpoints,
          [action.key]: {
            ...previous,
            outcome: action.outcome,
            evidence: action.evidence,
            confirmation,
            obstacle: action.outcome === "confirmed" ? "" : previous.obstacle,
          },
        },
      };
    }
    case "obstacle": {
      const previous = state.checkpoints[action.key];
      if (previous.obstacle === action.reason) return state;
      return {
        ...state,
        checkpoints: {
          ...state.checkpoints,
          [action.key]: {
            ...previous,
            obstacle: action.reason,
            outcome: action.reason.trim() ? "attempted" : previous.outcome,
          },
        },
      };
    }
    case "change": {
      const kinds = (Object.keys(action.values) as ChangeKind[]).filter(
        (kind) => action.values[kind] !== undefined && action.values[kind] !== state.changes[kind],
      );
      if (!kinds.length) return state;
      const keys = kinds.flatMap((kind) =>
        kind === "unknown"
          ? checkpointKeys.filter(
              (key) =>
                !key.startsWith("setup.") &&
                key !== "publish.shared" &&
                key !== "publish.terms" &&
                key !== "publish.deployed",
            )
          : changeImpact[kind],
      );
      return { ...invalidate(state, keys), changes: { ...state.changes, ...action.values } };
    }
    case "legacy": {
      // 이전 화면의 기록은 참고 자료로 보존하며 새 실제 목표로 승격하지 않는다.
      if (state.projectId !== "current") return state;
      let next = state;
      for (const unit of learningUnits) {
        for (const item of action.learned.filter((item) => item.unit === unit)) {
          if (next.learning[unit].status !== "unstarted" || next.learning[unit].sources.length)
            continue;
          next = projectProgressReducer(next, { type: "learn", ...item, status: "confirmed" });
        }
      }
      for (const [key, text] of Object.entries(action.notes)) {
        // 기존 화면이 초기화돼 빈 값을 보내도 이전 기록을 지우지 않는다.
        if (text.trim())
          next = projectProgressReducer(next, { type: "note", key: `legacy:${key}`, text });
      }
      return next;
    }
    case "location":
      // 경로 표기 정정만으로 외부 파일 변경을 추정하지 않는다.
      return action.value === state.location ? state : { ...state, location: action.value };
    case "address":
      return action.value.trim() === state.publicUrl
        ? state
        : { ...invalidate(state, changeImpact.address), publicUrl: action.value.trim() };
    case "project":
      if (!action.projectId.trim() || action.projectId === state.projectId) return state;
      return {
        ...invalidate(state, checkpointKeys),
        projectId: action.projectId,
        changes: {},
        location: "",
        publicUrl: "",
      };
  }
}
export function checkpointStatus(state: ProgressState, key: CheckpointKey) {
  const item = state.checkpoints[key];
  if (
    item.confirmation &&
    (item.confirmation.projectId !== state.projectId ||
      item.confirmation.revision !== item.revision)
  )
    return "recheck";
  if (item.outcome === "confirmed" && item.confirmation && !item.obstacle.trim())
    return "confirmed";
  if (item.obstacle.trim()) return "waiting";
  return item.outcome === "unverified" ? "unstarted" : "in-progress";
}
function decision(state: ProgressState, branch: keyof ProgressState["decisions"]) {
  const value = state.decisions[branch];
  return value.projectId === state.projectId ? value : { ...value, value: null, reason: "" };
}
export function requiredCheckpoints(state: ProgressState, stage: ProjectStage): CheckpointKey[] {
  const all = checkpointKeys.filter((key) => key.startsWith(`${stage}.`));
  if (stage === "experience")
    return decision(state, "experience").value === "keep"
      ? ["experience.observed", "experience.kept"]
      : all.filter((key) => key !== "experience.kept");
  if (stage === "data")
    return [
      decision(state, "details").value === "omit" ? "data.details-omitted" : "data.details",
      decision(state, "storage").value === "omit" ? "data.storage-omitted" : "data.storage",
      "data.scope",
    ];
  return stage === "publish" && decision(state, "storage").value !== "apply"
    ? all.filter((key) => key !== "publish.storage")
    : all;
}
export type StageStatus = "unstarted" | "in-progress" | "waiting" | "confirmed" | "recheck";
function validPublicAddress(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      !url.hostname.endsWith(".invalid") &&
      !url.hostname.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}
export function stageProgress(
  state: ProgressState,
  stage: ProjectStage,
): {
  status: StageStatus;
  missing: CheckpointKey[];
  unresolved: string[];
  prerequisite: ProjectStage | null;
} {
  const keys = requiredCheckpoints(state, stage);
  const missing = keys.filter((key) => checkpointStatus(state, key) !== "confirmed");
  const unresolved: string[] = [];
  const branches =
    stage === "experience"
      ? (["experience"] as const)
      : stage === "data"
        ? (["details", "storage"] as const)
        : [];
  for (const branch of branches) {
    const d = decision(state, branch);
    if (!d.value || !d.reason.trim()) unresolved.push(`${branch}-decision`);
  }
  if (stage === "publish" && !validPublicAddress(state.publicUrl))
    unresolved.push("public-address");
  const index = projectStages.indexOf(stage);
  const prerequisite =
    index > 0 && stageProgress(state, projectStages[index - 1]).status !== "confirmed"
      ? projectStages[index - 1]
      : null;
  const ownConfirmed = !missing.length && !unresolved.length;
  let status: StageStatus;
  if (ownConfirmed && !prerequisite) status = "confirmed";
  else if (
    keys.some((key) => checkpointStatus(state, key) === "recheck") ||
    (ownConfirmed && prerequisite)
  )
    status = "recheck";
  else if (keys.some((key) => checkpointStatus(state, key) === "waiting")) status = "waiting";
  else if (
    keys.some((key) => checkpointStatus(state, key) !== "unstarted") ||
    Object.values(state.notes).some(
      (note) => note.projectId === state.projectId && note.stage === stage && note.text.trim(),
    ) ||
    (stage === "experience" && decision(state, "experience").value) ||
    (stage === "data" && (decision(state, "details").value || decision(state, "storage").value))
  )
    status = "in-progress";
  else status = "unstarted";
  return { status, missing, unresolved, prerequisite };
}
export function projectProgress(state: ProgressState) {
  const learned = learningUnits.filter((key) => state.learning[key].status === "confirmed");
  const stages = Object.fromEntries(
    projectStages.map((stage) => [stage, stageProgress(state, stage)]),
  ) as Record<ProjectStage, ReturnType<typeof stageProgress>>;
  const complete =
    learned.length === learningUnits.length &&
    projectStages.every((stage) => stages[stage].status === "confirmed");
  const recheck = projectStages.some((stage) => stages[stage].status === "recheck");
  const started = projectStages.some((stage) => stages[stage].status !== "unstarted");
  return {
    learned,
    stages,
    complete,
    status: complete
      ? "complete"
      : recheck
        ? "recheck"
        : projectStages.some((stage) => stages[stage].status === "waiting")
          ? "waiting"
          : started
            ? "in-progress"
            : "unstarted",
  } as const;
}
