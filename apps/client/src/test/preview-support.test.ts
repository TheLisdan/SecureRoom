import { describe, expect, it } from "vitest";
import type { FileRecord } from "@secure-room/api-contract";

import {
  canPreviewFile,
  getFileTypeLabel,
  getPreviewKind,
} from "../features/files/preview-support";

const baseFile: FileRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  dataroomId: "00000000-0000-0000-0000-000000000002",
  folderId: null,
  name: "file.bin",
  mimeType: "application/octet-stream",
  sizeBytes: 128,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("preview support", () => {
  it.each([
    ["application/pdf", "deck.pdf", "pdf"],
    ["image/png", "photo.png", "image"],
    ["text/plain; charset=utf-8", "notes.txt", "text"],
    ["application/octet-stream", "README.md", "text"],
    ["audio/mpeg", "meeting.mp3", "audio"],
    ["video/mp4", "walkthrough.mp4", "video"],
  ] as const)("maps %s files to %s preview", (mimeType, name, kind) => {
    expect(getPreviewKind({ mimeType, name })).toBe(kind);
  });

  it("does not preview active or unknown document formats", () => {
    expect(
      getPreviewKind({ mimeType: "image/svg+xml", name: "diagram.svg" }),
    ).toBe(null);
    expect(getPreviewKind({ mimeType: "text/html", name: "page.html" })).toBe(
      null,
    );
    expect(canPreviewFile({ ...baseFile, name: "archive.zip" })).toBe(false);
  });

  it("returns readable file type labels", () => {
    expect(
      getFileTypeLabel({
        ...baseFile,
        name: "deal-notes.md",
        mimeType: "text/plain",
      }),
    ).toBe("Markdown");
    expect(getFileTypeLabel({ ...baseFile, mimeType: "image/jpeg" })).toBe(
      "Image",
    );
    expect(
      getFileTypeLabel({ ...baseFile, mimeType: "application/octet-stream" }),
    ).toBe("File");
  });
});
