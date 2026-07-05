import { describe, expect, it } from "vitest";

import { decodeMultipartFilename } from "./multipart-filename.js";

describe("decodeMultipartFilename", () => {
  it("keeps regular names unchanged", () => {
    expect(decodeMultipartFilename("deal-notes.md")).toBe("deal-notes.md");
    expect(decodeMultipartFilename("договор.md")).toBe("договор.md");
  });

  it("decodes UTF-8 filenames that multipart parsers exposed as latin1", () => {
    const mojibake = Buffer.from("договор аренды.md", "utf8").toString(
      "latin1",
    );

    expect(decodeMultipartFilename(mojibake)).toBe("договор аренды.md");
  });
});
