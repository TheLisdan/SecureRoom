import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileManagerItem } from "@secure-room/api-contract";

import { FileDetailsPanel } from "../features/files/FileDetailsPanel";

const fileItem: FileManagerItem = {
  type: "file",
  id: "00000000-0000-0000-0000-000000000001",
  name: "Disclosure.pdf",
  folderId: null,
  updatedAt: "2024-01-01T00:00:00.000Z",
  file: {
    id: "00000000-0000-0000-0000-000000000001",
    dataroomId: "00000000-0000-0000-0000-000000000002",
    folderId: null,
    name: "Disclosure.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
};

describe("FileDetailsPanel", () => {
  it("exposes file actions with the selected file payload", () => {
    const onPreview = vi.fn();
    const onMove = vi.fn();
    const onRename = vi.fn();
    const onDelete = vi.fn();

    render(
      <FileDetailsPanel
        item={fileItem}
        dataroomName="Acme Acquisition"
        ownerName="Alice Manager"
        onClose={vi.fn()}
        onRename={onRename}
        onMove={onMove}
        onDelete={onDelete}
        onPreview={onPreview}
      />,
    );

    expect(screen.getByText("PDF document")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute(
      "href",
      "http://localhost:3000/files/00000000-0000-0000-0000-000000000001/download",
    );

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    fireEvent.click(screen.getByRole("button", { name: "Move" }));
    fireEvent.click(screen.getByRole("button", { name: "Rename" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onPreview).toHaveBeenCalledWith(fileItem.file);
    expect(onMove).toHaveBeenCalledWith(fileItem.file);
    expect(onRename).toHaveBeenCalledWith(fileItem);
    expect(onDelete).toHaveBeenCalledWith(fileItem);
  });

  it("hides preview for unsupported file types", () => {
    render(
      <FileDetailsPanel
        item={{
          ...fileItem,
          name: "archive.zip",
          file: {
            ...fileItem.file,
            name: "archive.zip",
            mimeType: "application/zip",
          },
        }}
        dataroomName="Acme Acquisition"
        ownerName="Alice Manager"
        onClose={vi.fn()}
        onRename={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Preview" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move" })).toBeInTheDocument();
  });
});
