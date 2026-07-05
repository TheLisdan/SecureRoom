import { describe, expect, it } from "vitest";

import { getPreviewContentType } from "./preview-types.js";

describe("getPreviewContentType", () => {
  it("allows browser-safe preview types", () => {
    expect(getPreviewContentType("application/pdf")).toBe("application/pdf");
    expect(getPreviewContentType("image/png")).toBe("image/png");
    expect(getPreviewContentType("text/plain")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(getPreviewContentType("text/x-markdown")).toBe(
      "text/x-markdown; charset=utf-8",
    );
    expect(getPreviewContentType("audio/mpeg")).toBe("audio/mpeg");
    expect(getPreviewContentType("video/mp4")).toBe("video/mp4");
  });

  it("allows markdown preview by file extension when stored MIME is generic", () => {
    expect(getPreviewContentType("application/octet-stream", "notes.md")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(getPreviewContentType("", "readme.markdown")).toBe(
      "text/markdown; charset=utf-8",
    );
  });

  it("rejects active document formats", () => {
    expect(() => getPreviewContentType("text/html")).toThrow();
    expect(() => getPreviewContentType("image/svg+xml")).toThrow();
    expect(() => getPreviewContentType("application/javascript")).toThrow();
  });
});
