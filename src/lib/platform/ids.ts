// 주소 · 폼으로 들어온 id 검사. DB의 uuid(소문자, 8-4-4-4-12) 모양만 받는다.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
