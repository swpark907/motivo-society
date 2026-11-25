import { workbookCourse, workbookLessonId, workbookProjectStep } from "./workbook-course";
import { ASK_INTRO, findPlanButton, planLines } from "./workbook-plan-readers";
import {
  layoutSentence,
  moodSentence,
  situationSentence,
  takenReferenceLabels,
} from "./workbook-plan-options";

const lessonNumber = (step: number) => workbookCourse[1].lessons[step].number;
const AUDIENCE = lessonNumber(workbookProjectStep.audience);
const REFERENCES = lessonNumber(workbookProjectStep.references);
const STRUCTURE = lessonNumber(workbookProjectStep.structure);
const BRIEF = lessonNumber(workbookProjectStep.brief);
const REQUEST = workbookCourse[0].lessons[workbookLessonId.firstRequest].number;

// 2-1 기획을 1-5의 네 칸 메모(무엇을 · 어디에 쓸지 · 조건 · 하지 말 것)로 옮긴다. 2-2가 보여 주고, 복사해서
// Claude 앱의 같은 대화로 보낸다. 조사(은/는·이/가)를 붙이지 않는 문장으로 써서 어떤 기획이 들어와도 맞게 읽힌다.

export type PlanForMemo = {
  title: string;
  audience: string;
  purpose: string;
  intro: string;
  content: string;
  later: string;
  entry?: string;
  device?: string;
  pace?: string;
  layout?: string;
  mood?: string;
  buttonLabel?: string;
  references?: string;
};
export type MemoRow = {
  label: "무엇을" | "어디에 쓸지" | "조건" | "하지 말 것";
  line: string;
  /** 이 줄이 2-1의 어느 기획에서 왔는지. */
  from: string;
};

/** "하지 말 것"의 첫 문장. 2-2 화면 2에서 이 줄을 켜고 끄며 차이를 본다. */
export const NO_NEW_FILE = "새 폴더나 새 파일은 만들지 마.";

export function planMemo(plan: PlanForMemo): MemoRow[] {
  const button = findPlanButton(plan.purpose);
  const now = planLines(plan.content);
  const later = planLines(plan.later);
  const intro = plan.intro.trim();
  const ownIntro = intro && intro !== ASK_INTRO;
  const title = plan.title.trim() || "(제목)";
  const buttonText = plan.buttonLabel?.trim() || button?.label || plan.purpose.trim();
  const situation = [
    situationSentence.entry[plan.entry ?? ""],
    situationSentence.device[plan.device ?? ""],
    situationSentence.pace[plan.pace ?? ""],
  ].filter(Boolean);
  return [
    {
      label: "무엇을",
      line: `my-first-web 폴더의 index.html을 먼저 읽고, 같은 파일을 내 홈페이지로 고쳐줘. 제목은 “${title}”로 해 줘.`,
      from: `${BRIEF} 제목`,
    },
    {
      label: "어디에 쓸지",
      line: [
        `이 페이지는 ${plan.audience.trim() || "(읽을 사람)"}에게 보여줄 거야.`,
        situation.length ? `이 사람은 ${situation.join(" ")}` : "",
        `다 읽은 사람이 맨 아래 ‘${buttonText}’ 버튼을 누르게 하고 싶어.`,
      ]
        .filter(Boolean)
        .join(" "),
      from: `${AUDIENCE} 읽을 사람 · 상황 · 버튼, ${BRIEF} 버튼 문구`,
    },
    {
      label: "조건",
      line: [
        `제목과 소개 글 아래에 이 순서로 넣어줘: ${now.length ? now.join(", ") : "(넣을 내용)"}.`,
        "각 항목에 들어갈 실제 내용은 만들기 전에 나에게 하나씩 물어보고 채워줘.",
        ownIntro ? `소개 글은 이 글을 그대로 써 줘: ${intro}` : "소개 글도 나에게 물어보고 채워줘.",
        layoutSentence[plan.layout ?? ""] ?? "",
        takenReferenceLabels(plan.references ?? "").length
          ? `참고할 구성: ${takenReferenceLabels(plan.references ?? "").join(", ")}.`
          : "",
        moodSentence[plan.mood ?? ""] ?? "",
      ]
        .filter(Boolean)
        .join(" "),
      from: `${REFERENCES} 레퍼런스, ${STRUCTURE} 넣을 내용 · 순서 · 배치, ${BRIEF} 분위기`,
    },
    {
      label: "하지 말 것",
      line: [
        NO_NEW_FILE,
        "내가 말하지 않은 경력이나 숫자는 넣지 마.",
        later.length ? `이건 아직 넣지 마: ${later.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      from: later.length ? `${STRUCTURE} 나중에 채울 내용` : `${REQUEST}에서 배운 것`,
    },
  ];
}

/** 복사해서 보내는 메모 글. */
export function planMemoText(plan: PlanForMemo) {
  return planMemo(plan)
    .map((row) => row.line)
    .join("\n");
}

/** AI가 이 기획을 받고 할 법한 질문 셋과, 질문마다 보여 줄 정직한 대답의 모양(○○는 학습자가 채운다).
 *  기획 수업 화면 5는 질문만, 요청 수업 화면 3은 질문과 대답을 쓴다. */
export function planQuestions(plan: PlanForMemo): { question: string; answer: string }[] {
  const now = planLines(plan.content);
  const later = planLines(plan.later);
  const button = findPlanButton(plan.purpose);
  return [
    now[0]
      ? {
          question: `‘${now[0]}’에는 구체적으로 어떤 내용을 적을까요? 하나만 고른다면요?`,
          answer: "하나만 넣을게. 내가 실제로 해 본 ○○야.",
        }
      : {
          question: "이 페이지에서 가장 먼저 보여줄 것은 무엇인가요?",
          answer: "○○부터 보여 줘.",
        },
    button
      ? {
          question: `‘${button.label}’ 버튼을 누르면 어떤 화면으로 가야 하나요?`,
          answer: "아직 정하지 않았어. 버튼만 두고, 누르면 갈 곳은 비워 둬.",
        }
      : {
          question: "다 읽은 사람이 마지막에 무엇을 했으면 하나요?",
          answer: "○○ 버튼을 누르면 좋겠어.",
        },
    later[0]
      ? {
          question: `‘${later[0]}’ 내용은 언제쯤 채울 수 있나요? 그전까지는 페이지에서 빼 둘까요?`,
          answer: "아직 없어. 그 내용은 빼 둬.",
        }
      : {
          question: "다 읽은 사람이 딱 하나만 기억한다면, 무엇이었으면 하나요?",
          answer: "아직 모르겠어. 페이지를 만들어 보고 나서 정할게.",
        },
  ];
}
