export type EditorialInline =
  { type: "text" | "strong" | "code"; text: string } | { type: "link"; text: string; href: string };

// 허용한 인라인 표기만 데이터로 읽는다. HTML·JSX·표현식은 일반 문자열로 남는다.
export function parseEditorialInline(text: string): EditorialInline[] {
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)/g;
  const tokens: EditorialInline[] = [];
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    if (start > end) tokens.push({ type: "text", text: text.slice(end, start) });
    if (match[1]) tokens.push({ type: "strong", text: match[1] });
    else if (match[2]) tokens.push({ type: "code", text: match[2] });
    else tokens.push({ type: "link", text: match[3], href: match[4] });
    end = start + match[0].length;
  }
  if (end < text.length) tokens.push({ type: "text", text: text.slice(end) });
  return tokens;
}
