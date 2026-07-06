import { describe, expect, it } from "vitest";

import { dedupeFileName } from "./file-name-dedup.js";

describe("dedupeFileName", () => {
  it("keeps the requested name when it is available", () => {
    expect(dedupeFileName("Disclosure.pdf", ["Notes.pdf"])).toBe(
      "Disclosure.pdf",
    );
  });

  it("adds a copy suffix before the extension for duplicate names", () => {
    expect(dedupeFileName("Disclosure.pdf", ["Disclosure.pdf"])).toBe(
      "Disclosure (1).pdf",
    );
  });

  it("uses the next available number case-insensitively", () => {
    expect(
      dedupeFileName("Disclosure.pdf", [
        "disclosure.pdf",
        "Disclosure (1).pdf",
      ]),
    ).toBe("Disclosure (2).pdf");
  });

  it("supports names without extensions", () => {
    expect(dedupeFileName("Notes", ["Notes"])).toBe("Notes (1)");
  });

  it("truncates long base names while preserving the suffix and extension", () => {
    const requestedName = `${"a".repeat(178)}.pdf`;

    const dedupedName = dedupeFileName(requestedName, [requestedName]);

    expect(dedupedName).toHaveLength(180);
    expect(dedupedName.endsWith(" (1).pdf")).toBe(true);
  });
});
