import { describe, expect, it } from "vitest";

import { validateFileUpload } from "./file-upload-validation.js";

describe("validateFileUpload", () => {
  it("accepts safe file names across file types", () => {
    expect(
      validateFileUpload(
        {
          originalName: "financials.xlsx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          sizeBytes: 128,
        },
        1024,
      ),
    ).toMatchObject({
      name: "financials.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      storageExtension: "xlsx",
    });
  });

  it("normalizes missing or unsafe MIME metadata without trusting it", () => {
    expect(
      validateFileUpload(
        {
          originalName: "notes",
          mimeType: "",
          sizeBytes: 12,
        },
        1024,
      ),
    ).toMatchObject({
      mimeType: "application/octet-stream",
      storageExtension: "bin",
    });
  });

  it("infers markdown MIME type from .md names when browsers send generic metadata", () => {
    expect(
      validateFileUpload(
        {
          originalName: "deal-notes.md",
          mimeType: "application/octet-stream",
          sizeBytes: 64,
        },
        1024,
      ),
    ).toMatchObject({
      mimeType: "text/markdown",
      storageExtension: "md",
    });

    expect(
      validateFileUpload(
        {
          originalName: "readme.markdown",
          mimeType: "",
          sizeBytes: 64,
        },
        1024,
      ),
    ).toMatchObject({
      mimeType: "text/markdown",
      storageExtension: "markdown",
    });
  });

  it("rejects unsafe names and empty files", () => {
    expect(() =>
      validateFileUpload(
        {
          originalName: "../statement.pdf",
          mimeType: "application/pdf",
          sizeBytes: 12,
        },
        1024,
      ),
    ).toThrow();

    expect(() =>
      validateFileUpload(
        {
          originalName: "empty.txt",
          mimeType: "text/plain",
          sizeBytes: 0,
        },
        1024,
      ),
    ).toThrow();
  });

  it("rejects files larger than the configured limit", () => {
    expect(() =>
      validateFileUpload(
        {
          originalName: "archive.zip",
          mimeType: "application/zip",
          sizeBytes: 1025,
        },
        1024,
      ),
    ).toThrow();
  });
});
