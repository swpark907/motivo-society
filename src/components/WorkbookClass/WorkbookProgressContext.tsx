"use client";

// 이 클래스의 방문 상태는 워크북 레이아웃이 소유한다. 화면/라우트 재마운트와 분리하고,
// 향후 회원별 진행 데이터는 이 경계에서 초기화·갱신한다. 학습 진도는 메모리로 유지하고 첨부 결과만 브라우저에 임시 저장한다.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useReducer,
  useCallback,
  useMemo,
  type SetStateAction,
  type ReactNode,
} from "react";
import {
  emptyProjectProgress,
  projectProgress,
  projectProgressReducer,
  type LearningUnit,
} from "@/lib/workbook-project-progress";
import { useResultDraft } from "./useResultDraft";
import type { ResultDraft } from "@/lib/workbook-result-draft";
import { emptyApplications, type ApplicationStage } from "@/lib/workbook-application";
import { emptyPractice, type PracticeRecord } from "./WorkbookPracticeLesson";
import { emptyProject, type ProjectRecord } from "./WorkbookProjectLesson";
import { emptyData } from "./WorkbookDataLesson";
import { emptyPublish } from "./WorkbookPublishLesson";
import { emptyExperience } from "./WorkbookExperienceLesson";
import { type SetupStatus } from "./WorkbookSetupLesson";
import { WorkbookRoomProvider } from "@/components/WorkbookSpacePreview/WorkbookRoomProvider";
import { eligibleRoomRewards } from "@/lib/workbook-room-rewards";

type PreviewRecords = {
  project: ProjectRecord;
  experience: ReturnType<typeof emptyExperience>;
};
export type ResultMark = {
  id: string;
  note: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
type Annotations = { before: ResultMark[]; after: ResultMark[] };
type AnnotationHistory = {
  current: Annotations;
  past: Annotations[];
  future: Annotations[];
  pending: Annotations | null;
};
type AnnotationAction =
  | { type: "set"; value: SetStateAction<Annotations> }
  | { type: "begin" | "end" | "cancel" | "undo" | "redo" }
  | { type: "reset"; screen: "before" | "after" }
  | { type: "restore"; value: Annotations };
function sameAnnotations(a: Annotations, b: Annotations) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function annotationReducer(state: AnnotationHistory, action: AnnotationAction): AnnotationHistory {
  if (action.type === "restore")
    return { current: action.value, past: [], future: [], pending: null };
  if (action.type === "set") {
    const current = typeof action.value === "function" ? action.value(state.current) : action.value;
    if (sameAnnotations(current, state.current)) return state;
    return {
      ...state,
      current,
      past: state.pending ? state.past : [...state.past, state.current].slice(-100),
      future: state.pending ? state.future : [],
    };
  }
  if (action.type === "reset")
    return {
      current: { ...state.current, [action.screen]: [] },
      past: [],
      future: [],
      pending: null,
    };
  if (action.type === "begin") {
    const committed = state.pending ? annotationReducer(state, { type: "end" }) : state;
    return { ...committed, pending: committed.current };
  }
  if (action.type === "end")
    return !state.pending
      ? state
      : {
          ...state,
          past: sameAnnotations(state.pending, state.current)
            ? state.past
            : [...state.past, state.pending].slice(-100),
          future: sameAnnotations(state.pending, state.current) ? state.future : [],
          pending: null,
        };
  if (action.type === "cancel")
    return !state.pending ? state : { ...state, current: state.pending, pending: null };
  if (state.pending) return annotationReducer(annotationReducer(state, { type: "end" }), action);
  if (action.type === "undo" && state.past.length)
    return {
      current: state.past[state.past.length - 1],
      past: state.past.slice(0, -1),
      future: [state.current, ...state.future],
      pending: null,
    };
  if (action.type === "redo" && state.future.length)
    return {
      current: state.future[0],
      past: [...state.past, state.current],
      future: state.future.slice(1),
      pending: null,
    };
  return state;
}
function useProgressState(preview?: PreviewRecords) {
  // 화면 판정은 후속 작업에서 연결한다. 새 실제 목표는 예시·기존 confirmed로 채우지 않는다.
  const [projectWorkflow, dispatchProjectWorkflow] = useReducer(
    projectProgressReducer,
    undefined,
    () => emptyProjectProgress(),
  );
  const projectWorkflowProgress = useMemo(
    () => projectProgress(projectWorkflow),
    [projectWorkflow],
  );
  const [annotationHistory, dispatchAnnotations] = useReducer(annotationReducer, {
    current: { before: [], after: [] },
    past: [],
    future: [],
    pending: null,
  });
  const resultAnnotations = annotationHistory.current;
  const setResultAnnotations = (value: SetStateAction<Annotations>) =>
    dispatchAnnotations({ type: "set", value });
  const beginAnnotationEdit = useCallback(() => dispatchAnnotations({ type: "begin" }), []);
  const endAnnotationEdit = useCallback(() => dispatchAnnotations({ type: "end" }), []);
  const cancelAnnotationEdit = useCallback(() => dispatchAnnotations({ type: "cancel" }), []);
  const undoAnnotations = useCallback(() => dispatchAnnotations({ type: "undo" }), []);
  const redoAnnotations = useCallback(() => dispatchAnnotations({ type: "redo" }), []);
  const resetScreenAnnotations = (screen: "before" | "after") =>
    dispatchAnnotations({ type: "reset", screen });
  const [resultScreens, setResultScreens] = useState<
    Record<"project" | "experience", { before: string | null; after: string | null }>
  >({
    project: { before: null, after: null },
    experience: { before: null, after: null },
  });
  const restoreResultDraft = useCallback((data: ResultDraft) => {
    setResultScreens(data.screens);
    dispatchAnnotations({ type: "restore", value: data.annotations });
  }, []);
  const resultPayload = useMemo(
    () => ({ screens: resultScreens, annotations: resultAnnotations }),
    [resultScreens, resultAnnotations],
  );
  const resultDraft = useResultDraft(
    preview ? "demo:vibe-web" : "vibe-web",
    resultPayload,
    restoreResultDraft,
  );
  const clearResultDraft = useCallback(() => {
    setResultScreens({
      project: { before: null, after: null },
      experience: { before: null, after: null },
    });
    dispatchAnnotations({ type: "restore", value: { before: [], after: [] } });
  }, []);
  const [lessonUi, setLessonUi] = useState<Record<string, unknown>>({});
  const [purpose, setPurpose] = useState<string | null>(null);
  const [applications, setApplications] = useState(emptyApplications);
  const [scene, setScene] = useState(0);
  const [reviewView, setReviewView] = useState<"summary" | ApplicationStage | null>(null);
  const [mapWorld, setMapWorld] = useState<"ai" | "project" | "experience" | "data" | "publish">(
    "ai",
  );
  const [projectStop, setProjectStop] = useState(0);
  const [experienceStop, setExperienceStop] = useState(0);
  const [dataStop, setDataStop] = useState(0);
  const [publishStop, setPublishStop] = useState(0);
  const [lesson, setLesson] = useState<number | null>(null);
  const [currentStop, setCurrentStop] = useState(-1);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [practice, setPractice] = useState<Record<number, PracticeRecord>>({
    3: emptyPractice(),
    4: emptyPractice(),
  });
  const [completed, setCompleted] = useState<number[]>(preview ? [0, 1, 2, 3, 4] : []);
  const [project, setProject] = useState<ProjectRecord>(() => preview?.project ?? emptyProject());
  const [projectCompleted, setProjectCompleted] = useState(Boolean(preview));
  const [experience, setExperience] = useState(() => preview?.experience ?? emptyExperience());
  const [experienceCompleted, setExperienceCompleted] = useState(Boolean(preview));
  const [data, setData] = useState(emptyData);
  const [dataCompleted, setDataCompleted] = useState(false);
  const [publish, setPublish] = useState(emptyPublish);
  const [publishCompleted, setPublishCompleted] = useState(false);
  useEffect(() => {
    const learned: { unit: LearningUnit; source: "example" | "computer" }[] = [];
    for (let index = 0; index < 5; index++) {
      if (completed.includes(index))
        learned.push({
          unit: `ai-${index + 1}` as LearningUnit,
          source: index >= 3 && practice[index]?.mode === "computer" ? "computer" : "example",
        });
    }
    if (projectCompleted)
      learned.push({
        unit: "project",
        source: project.mode === "computer" ? "computer" : "example",
      });
    if (experienceCompleted)
      learned.push({
        unit: "experience",
        source: "example",
      });
    if (dataCompleted) learned.push({ unit: "data", source: "example" });
    if (publishCompleted) learned.push({ unit: "publish", source: "example" });
    const notes: Record<string, string> = {};
    const records = {
      project,
      experience,
      data,
      publish,
      practice3: practice[3],
      practice4: practice[4],
      ...Object.fromEntries(
        Object.entries(applications).map(([key, value]) => [`application-${key}`, value]),
      ),
    };
    for (const [recordKey, record] of Object.entries(records)) {
      for (const [field, value] of Object.entries(record)) {
        if (typeof value === "string") notes[`${recordKey}.${field}`] = value;
      }
    }
    dispatchProjectWorkflow({ type: "legacy", learned, notes });
  }, [
    completed,
    practice,
    projectCompleted,
    project,
    experienceCompleted,
    experience,
    dataCompleted,
    data,
    publishCompleted,
    publish,
    applications,
  ]);
  return {
    projectWorkflow,
    dispatchProjectWorkflow,
    projectWorkflowProgress,
    resultScreens,
    setResultScreens,
    resultDraft,
    clearResultDraft,
    resultAnnotations,
    setResultAnnotations,
    beginAnnotationEdit,
    endAnnotationEdit,
    cancelAnnotationEdit,
    undoAnnotations,
    redoAnnotations,
    resetScreenAnnotations,
    canUndoAnnotations:
      annotationHistory.past.length > 0 ||
      Boolean(
        annotationHistory.pending &&
        !sameAnnotations(annotationHistory.pending, annotationHistory.current),
      ),
    canRedoAnnotations:
      annotationHistory.future.length > 0 &&
      (!annotationHistory.pending ||
        sameAnnotations(annotationHistory.pending, annotationHistory.current)),
    lessonUi,
    setLessonUi,
    purpose,
    setPurpose,
    reviewView,
    setReviewView,
    applications,
    mapWorld,
    setMapWorld,
    projectStop,
    setProjectStop,
    experienceStop,
    setExperienceStop,
    publishStop,
    setPublishStop,
    dataStop,
    setDataStop,
    setApplications,
    publish,
    setPublish,
    publishCompleted,
    setPublishCompleted,
    data,
    setData,
    dataCompleted,
    setDataCompleted,
    experience,
    setExperience,
    experienceCompleted,
    setExperienceCompleted,
    scene,
    setScene,
    lesson,
    setLesson,
    currentStop,
    setCurrentStop,
    setupStatus,
    setSetupStatus,
    practice,
    setPractice,
    completed,
    setCompleted,
    project,
    setProject,
    projectCompleted,
    setProjectCompleted,
  };
}
const WorkbookProgressContext = createContext<ReturnType<typeof useProgressState> | null>(null);
export function WorkbookProgressProvider({ children }: { children: ReactNode }) {
  const progress = useProgressState();
  return (
    <WorkbookProgressContext.Provider value={progress}>
      <WorkbookRoomProvider
        eligible={eligibleRoomRewards({ ...progress, projectMode: progress.project.mode })}
      >
        {children}
      </WorkbookRoomProvider>
    </WorkbookProgressContext.Provider>
  );
}
// 검토용 기록은 독립 Context에만 둔다. 작업실 저장·보상 해금 Provider를 연결하지 않는다.
export function WorkbookProgressPreviewProvider({
  records,
  children,
}: {
  records: PreviewRecords;
  children: ReactNode;
}) {
  const progress = useProgressState(records);
  return (
    <WorkbookProgressContext.Provider value={progress}>{children}</WorkbookProgressContext.Provider>
  );
}
export function useWorkbookProgress() {
  const progress = useContext(WorkbookProgressContext);
  if (!progress) throw new Error("WorkbookProgressProvider is required");
  return progress;
}
