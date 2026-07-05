import { describe, expect, it } from "vitest";

import { DomainError } from "./domain-error.js";
import { UuidValidationPipe } from "./uuid-validation.pipe.js";

describe("UuidValidationPipe", () => {
  it("returns valid UUIDs", () => {
    const id = "00000000-0000-0000-0000-000000000001";

    expect(new UuidValidationPipe("fileId").transform(id)).toBe(id);
  });

  it("rejects invalid UUIDs with a typed domain error", () => {
    expect(() => new UuidValidationPipe("fileId").transform("../bad")).toThrow(
      DomainError,
    );
  });
});
