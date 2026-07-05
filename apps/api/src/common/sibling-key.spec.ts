import { describe, expect, it } from "vitest";

import { locationKey, normalizeSiblingName } from "./sibling-key.js";

describe("sibling keys", () => {
  it("normalizes names for case-insensitive sibling uniqueness", () => {
    expect(normalizeSiblingName("  Legal.PDF ")).toBe("legal.pdf");
  });

  it("uses a stable non-null root location key", () => {
    expect(locationKey(null)).toBe("root");
    expect(locationKey("00000000-0000-0000-0000-000000000001")).toBe(
      "00000000-0000-0000-0000-000000000001",
    );
  });
});
