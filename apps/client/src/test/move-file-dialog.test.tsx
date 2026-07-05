import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileRecord, Folder } from "@secure-room/api-contract";

import { MoveFileDialog } from "../features/files/MoveFileDialog";

const file: FileRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  dataroomId: "00000000-0000-0000-0000-000000000002",
  folderId: null,
  name: "Disclosure.pdf",
  mimeType: "application/pdf",
  sizeBytes: 2048,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const legalFolder: Folder = {
  id: "00000000-0000-0000-0000-000000000003",
  dataroomId: file.dataroomId,
  parentFolderId: null,
  name: "Legal",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const folders: Folder[] = [
  legalFolder,
  {
    id: "00000000-0000-0000-0000-000000000004",
    dataroomId: file.dataroomId,
    parentFolderId: "00000000-0000-0000-0000-000000000003",
    name: "Contracts",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

describe("MoveFileDialog", () => {
  it("shows root and nested folders, then submits the selected folder", () => {
    const onSubmit = vi.fn();

    renderDialog({ onSubmit });

    expect(screen.getByRole("dialog", { name: "Move file" })).toBeVisible();
    expect(screen.getByRole("button", { name: /home/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Legal" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Contracts" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Legal" }));
    fireEvent.click(screen.getByRole("button", { name: "Move" }));

    expect(onSubmit).toHaveBeenCalledWith(legalFolder.id);
  });

  it("keeps the move action disabled for the current destination", () => {
    const onSubmit = vi.fn();

    renderDialog({ file: { ...file, folderId: legalFolder.id }, onSubmit });

    expect(
      screen.getByRole("button", { name: /legal current/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Move" })).toBeDisabled();
  });
});

function renderDialog({
  file: selectedFile = file,
  onSubmit = vi.fn(),
}: {
  file?: FileRecord;
  onSubmit?: (folderId: string | null) => void;
}) {
  return render(
    <MoveFileDialog
      file={selectedFile}
      folders={folders}
      isPending={false}
      error={null}
      onOpenChange={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
}
