import { describe, expect, it } from "vitest";

import { extractSearchText } from "./search-text.js";

describe("extractSearchText", () => {
  it("extracts normalized text from allowlisted text files", () => {
    expect(
      extractSearchText({
        fileName: "notes.md",
        mimeType: "text/markdown",
        buffer: Buffer.from("# Revenue notes\n\nARR grew by 18%.", "utf8"),
      }),
    ).toBe("# Revenue notes ARR grew by 18%.");
  });

  it("does not index binary-only formats", () => {
    expect(
      extractSearchText({
        fileName: "disclosure.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7"),
      }),
    ).toBeNull();
  });
});
