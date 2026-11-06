import { describe, expect, it } from "vitest";
import { isEmailLike, loginHref, onboardingHref, safeNext } from "./auth-paths";

describe("safeNext", () => {
  it("같은 사이트 경로는 그대로 둔다", () => {
    expect(safeNext("/me")).toBe("/me");
    expect(safeNext("/activities/a-b?x=1")).toBe("/activities/a-b?x=1");
  });

  it("다른 사이트로 가는 값은 홈으로 바꾼다", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "evil", "/\nme"]) {
      expect(safeNext(bad)).toBe("/");
    }
  });

  it("비었거나 로그인·콜백 경로면 기본값", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext("")).toBe("/");
    expect(safeNext("/login?next=/me")).toBe("/");
    expect(safeNext("/auth/callback")).toBe("/");
    expect(safeNext("/onboarding?next=/me")).toBe("/");
    expect(safeNext(undefined, "/me")).toBe("/me");
  });
});

describe("loginHref", () => {
  it("돌아올 곳을 담는다", () => {
    expect(loginHref("/me")).toBe("/login?next=%2Fme");
    expect(loginHref("/")).toBe("/login");
    expect(onboardingHref("/clubs")).toBe("/onboarding?next=%2Fclubs");
  });
});

describe("isEmailLike", () => {
  it("기본 형식만 본다", () => {
    expect(isEmailLike("a@b.co")).toBe(true);
    expect(isEmailLike("a@b")).toBe(false);
    expect(isEmailLike("a b@c.d")).toBe(false);
  });
});
