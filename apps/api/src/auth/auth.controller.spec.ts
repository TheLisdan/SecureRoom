import "reflect-metadata";

import { describe, expect, it } from "vitest";

import { AuthController } from "./auth.controller.js";

describe("AuthController throttling", () => {
  it("uses stricter rate limits on login and register", () => {
    expect(
      Reflect.getMetadata(
        "THROTTLER:LIMITdefault",
        AuthController.prototype.login,
      ),
    ).toBe(8);
    expect(
      Reflect.getMetadata(
        "THROTTLER:LIMITdefault",
        AuthController.prototype.register,
      ),
    ).toBe(8);
  });
});
