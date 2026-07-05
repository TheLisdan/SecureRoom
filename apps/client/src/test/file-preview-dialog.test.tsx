import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FileRecord } from "@secure-room/api-contract";

import { FilePreviewDialog } from "../features/files/FilePreviewDialog";

const textFile: FileRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  dataroomId: "00000000-0000-0000-0000-000000000002",
  folderId: null,
  name: "notes.txt",
  mimeType: "text/plain",
  sizeBytes: 32,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("FilePreviewDialog", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads authenticated text previews", async () => {
    fetchMock.mockResolvedValue(
      new Response("Revenue notes", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    render(<FilePreviewDialog file={textFile} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Loading preview...")).toBeInTheDocument();
    await expect(screen.findByText("Revenue notes")).resolves.toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/files/00000000-0000-0000-0000-000000000001/preview",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("does not fetch unsupported files and shows a download fallback", async () => {
    render(
      <FilePreviewDialog
        file={{
          ...textFile,
          name: "archive.zip",
          mimeType: "application/zip",
        }}
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Preview is not available for this file type."),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute(
      "href",
      "http://localhost:3000/files/00000000-0000-0000-0000-000000000001/download",
    );
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
  });
});
