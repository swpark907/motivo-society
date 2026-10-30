import { expect, it } from "vitest";
import { parseEditorialInline } from "./workbook-editorial-inline";

it("reads supported emphasis and HTTPS links while keeping executable syntax as plain text", () => {
  expect(parseEditorialInline("내 **질문**과 [원문](https://example.com/source)을 `확인`")).toEqual(
    [
      { type: "text", text: "내 " },
      { type: "strong", text: "질문" },
      { type: "text", text: "과 " },
      { type: "link", text: "원문", href: "https://example.com/source" },
      { type: "text", text: "을 " },
      { type: "code", text: "확인" },
    ],
  );
  const executable = "<script>alert(1)</script> {process.env.SECRET} [클릭](javascript:alert(1))";
  expect(parseEditorialInline(executable)).toEqual([{ type: "text", text: executable }]);
});
