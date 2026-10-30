import type {
  EditorialBlock,
  WorkbookReadingDocument,
} from "@/lib/content/workbook-editorial-schema";

export const EDITORIAL_PREVIEW_CHANGE = "motivo.editorial.preview.change.v1";
export const BLOCK_LABELS: Record<EditorialBlock["type"], string> = {
  text: "문단",
  quote: "인용문",
  compare: "비교",
  list: "요점 목록",
  callout: "핵심 메모",
  qa: "질문과 답변",
  heading: "소제목",
  image: "사진",
  split: "사진과 글",
};
export type SelectionGroup = {
  key: string;
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  advanced?: boolean;
};
const alignment = [
  ["left", "왼쪽 정렬"],
  ["center", "가운데 정렬"],
] as const;
const width = [
  ["reading", "읽기 폭"],
  ["wide", "넓게"],
  ["full", "전체 폭"],
] as const;
const ratio = [
  ["wide", "가로 사진 · 16:9"],
  ["square", "정사각 · 1:1"],
  ["portrait", "세로 사진 · 4:5"],
] as const;
const focus = [
  ["left", "왼쪽 초점"],
  ["center", "가운데 초점"],
  ["right", "오른쪽 초점"],
] as const;
export function findEditorialBlock(
  document: WorkbookReadingDocument,
  id: string,
): EditorialBlock | undefined {
  for (const block of document.content) {
    if (block.id === id) return block;
    if (block.type === "split") {
      const child = block.content.find((item) => item.id === id);
      if (child) return child;
    }
  }
}
export function getSelectionGroups(
  document: WorkbookReadingDocument,
  id: string,
): SelectionGroup[] {
  if (id === "@cover")
    return [
      {
        key: "layout",
        label: "표지 배치",
        value: document.cover.layout,
        options: [
          ["title-first", "제목 먼저"],
          ["image-first", "사진 먼저"],
          ["split", "좌우 배치"],
          ["compact", "작은 사진"],
        ],
      },
      { key: "align", label: "정렬", value: document.cover.align, options: alignment },
      {
        key: "focus",
        label: "사진 초점",
        value: document.cover.focus,
        options: focus,
        advanced: true,
      },
    ];
  const block = findEditorialBlock(document, id);
  if (!block) return [];
  const groups: SelectionGroup[] = [];
  if (block.type === "text")
    groups.push({
      key: "tone",
      label: "문단 스타일",
      value: block.tone,
      options: [
        ["body", "기본 문단"],
        ["lead", "큰 도입문"],
        ["small", "보조 문장"],
        ["columns", "잡지 2단"],
        ["dropcap", "드롭캡"],
      ],
    });
  if (block.type === "quote")
    groups.push({
      key: "layout",
      label: "인용 스타일",
      value: block.layout,
      options: [
        ["rule", "선으로 구분"],
        ["statement", "큰 문장"],
        ["pull", "큰 따옴표"],
        ["margin", "여백 인용"],
      ],
    });
  if (block.type === "text" || block.type === "quote" || block.type === "callout")
    groups.push({ key: "align", label: "정렬", value: block.align, options: alignment });
  if (block.type === "list")
    groups.push({
      key: "layout",
      label: "목록 스타일",
      value: block.layout,
      options: [
        ["rows", "한 줄씩"],
        ["grid", "2열"],
        ["steps", "큰 번호"],
        ["timeline", "타임라인"],
        ["checklist", "체크리스트"],
      ],
    });
  if (block.type === "compare")
    groups.push({
      key: "layout",
      label: "비교 배치",
      value: block.layout,
      options: [
        ["columns", "나란히"],
        ["stack", "세로로"],
        ["contrast", "명암 대비"],
        ["table", "항목 대조"],
      ],
    });
  if (block.type === "callout")
    groups.push({
      key: "layout",
      label: "메모 스타일",
      value: block.layout,
      options: [
        ["note", "테두리 메모"],
        ["band", "가로 띠"],
        ["aside", "옆선 메모"],
      ],
    });
  if (block.type === "qa")
    groups.push({
      key: "layout",
      label: "문답 스타일",
      value: block.layout,
      options: [
        ["interview", "인터뷰"],
        ["columns", "질문·답변 좌우"],
        ["ruled", "선으로 구분"],
      ],
    });
  if (block.type === "split") {
    groups.push({
      key: "imageSide",
      label: "사진 위치",
      value: block.imageSide,
      options: [
        ["left", "사진 왼쪽"],
        ["right", "사진 오른쪽"],
      ],
    });
    groups.push({
      key: "proportion",
      label: "좌우 비율",
      value: block.proportion,
      options: [
        ["equal", "같은 폭"],
        ["image-wide", "사진 넓게"],
        ["text-wide", "글 넓게"],
      ],
    });
    groups.push({
      key: "verticalAlign",
      label: "세로 맞춤",
      value: block.verticalAlign,
      options: [
        ["start", "위에 맞춤"],
        ["center", "가운데 맞춤"],
      ],
      advanced: true,
    });
  }
  if (block.type === "image" || block.type === "split") {
    groups.push({
      key: "image.ratio",
      label: "사진 비율",
      value: block.image.ratio,
      options: ratio,
      advanced: block.type === "split",
    });
    groups.push({
      key: "image.focus",
      label: "사진 초점",
      value: block.image.focus,
      options: focus,
      advanced: block.type === "split",
    });
    groups.push({
      key: "image.crop",
      label: "사진 크롭",
      value: block.image.crop,
      options: [
        ["scene", "비율에 맞춤"],
        ["detail", "초점 확대 · 1.25배"],
      ],
      advanced: true,
    });
  }
  if ("width" in block)
    groups.push({
      key: "width",
      label: "너비",
      value: block.width,
      options: block.type === "split" || block.type === "compare" ? width.slice(1) : width,
      advanced: true,
    });
  return groups;
}
export function applySelectionOption(
  document: WorkbookReadingDocument,
  id: string,
  key: string,
  value: string,
): WorkbookReadingDocument {
  const group = getSelectionGroups(document, id).find((item) => item.key === key);
  if (!group?.options.some(([option]) => option === value))
    throw new Error("이 구간에서 사용할 수 없는 배치예요.");
  const copy = structuredClone(document);
  const target = id === "@cover" ? copy.cover : findEditorialBlock(copy, id)!;
  if (key.startsWith("image.") && "image" in target) Reflect.set(target.image, key.slice(6), value);
  else Reflect.set(target, key, value);
  return copy;
}
export function getSelectionText(document: WorkbookReadingDocument, id: string): string | null {
  if (id === "@cover") return document.displayTitle?.join("\n") ?? document.title;
  const block = findEditorialBlock(document, id);
  return block && "text" in block ? block.text : null;
}
export function applySelectionText(
  document: WorkbookReadingDocument,
  id: string,
  text: string,
): WorkbookReadingDocument {
  const copy = structuredClone(document);
  if (id === "@cover") {
    if (copy.displayTitle) copy.displayTitle = text.split("\n");
    else copy.title = text;
  } else {
    const block = findEditorialBlock(copy, id);
    if (!block || !("text" in block)) throw new Error("이 구간의 문구는 원문에서 수정해주세요.");
    block.text = text;
  }
  return copy;
}
