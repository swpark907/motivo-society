import { expect, it } from "vitest";
import { getWorkbookReadings } from "@/lib/content/workbook-readings";
import { createEditorialBlock } from "./editor-state";
import {
  getBlockInputMessages,
  getBlockInputFeedback,
  getSelectionInputMessages,
  requiredFieldMessage,
} from "./input-feedback";
it("names the exact missing item and handles whitespace as empty", async () => {
  const [document] = await getWorkbookReadings();
  const qa = createEditorialBlock("qa", document, () => "test-qa");
  if (qa.type !== "qa") throw new Error("문답이 아닙니다.");
  expect(getBlockInputMessages(qa)).toEqual([]);
  qa.items.push({ question: "두 번째 질문", answer: "  " });
  expect(getBlockInputMessages(qa)).toEqual(["답변 2를 입력해주세요."]);
  expect(getBlockInputFeedback(qa)).toEqual([
    { message: "답변 2를 입력해주세요.", fieldKey: "answer-1" },
  ]);
  qa.items[1].answer = "답변을 채웠어요.";
  expect(getBlockInputMessages(qa)).toEqual([]);
  for (const type of ["compare", "list", "image"] as const) {
    const block = createEditorialBlock(type, document, () => `test-${type}`);
    if (block.type === "compare") {
      block.items[0].label = "";
      block.caption = "";
      expect(getBlockInputMessages(block)).toEqual([
        "항목 1 제목을 입력해주세요.",
        "비교 설명을 입력해주세요.",
      ]);
    }
    if (block.type === "list") {
      block.items[1].body = "";
      expect(getBlockInputMessages(block)).toEqual(["항목 2 내용을 입력해주세요."]);
    }
    if (block.type === "image") {
      block.image.alt = "";
      expect(getBlockInputMessages(block)).toEqual(["사진 설명을 입력해주세요."]);
    }
  }
});
it("identifies a missing cover title line and uses natural Korean particles", async () => {
  const [document] = await getWorkbookReadings();
  expect(
    getSelectionInputMessages({ ...document, displayTitle: ["첫 줄", "  "] }, "@cover"),
  ).toEqual(["제목 2번째 줄을 입력해주세요."]);
  expect(requiredFieldMessage("문단 내용")).toBe("문단 내용을 입력해주세요.");
  expect(requiredFieldMessage("답변 2")).toBe("답변 2를 입력해주세요.");
});
