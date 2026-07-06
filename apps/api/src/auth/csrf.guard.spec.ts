import { describe, expect, it } from "vitest";
import type { Request } from "express";
import type { ExecutionContext } from "@nestjs/common";

import { DomainError } from "../common/domain-error.js";
import { CsrfGuard } from "./csrf.guard.js";
import { csrfCookieName, sessionCookieName } from "./cookie-names.js";

describe("CsrfGuard", () => {
  const guard = new CsrfGuard();

  it("allows safe requests", () => {
    expect(
      guard.canActivate(contextFor({ method: "GET", path: "/datarooms" })),
    ).toBe(true);
  });

  it("allows login before a CSRF cookie exists", () => {
    expect(
      guard.canActivate(contextFor({ method: "POST", path: "/auth/login" })),
    ).toBe(true);
  });

  it("allows bearer-authenticated mutations without CSRF cookies", () => {
    expect(
      guard.canActivate(
        contextFor({
          method: "POST",
          path: "/datarooms",
          headers: { authorization: "Bearer token" },
        }),
      ),
    ).toBe(true);
  });

  it("rejects cookie-authenticated mutations without a matching header", () => {
    expect(() =>
      guard.canActivate(
        contextFor({
          method: "POST",
          path: "/datarooms",
          cookies: { [sessionCookieName]: "session", [csrfCookieName]: "csrf" },
          headers: {},
        }),
      ),
    ).toThrow(DomainError);
  });

  it("allows cookie-authenticated mutations with a matching header", () => {
    expect(
      guard.canActivate(
        contextFor({
          method: "PATCH",
          path: "/folders/00000000-0000-0000-0000-000000000001",
          cookies: { [sessionCookieName]: "session", [csrfCookieName]: "csrf" },
          headers: { "x-csrf-token": "csrf" },
        }),
      ),
    ).toBe(true);
  });
});

function contextFor(request: Partial<Request>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
