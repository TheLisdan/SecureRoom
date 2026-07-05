import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileManagerItem } from "@secure-room/api-contract";

import { FileTable } from "./FileTable";

const file: FileManagerItem = {
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

describe("FileTable", () => {
  const baseProps = {
    ownerName: "Alice Manager",
    selectedItemId: null,
    onSelectItem: vi.fn(),
    onOpenItem: vi.fn(),
    onPreview: vi.fn(),
    onRename: vi.fn(),
    onMove: vi.fn(),
    onDelete: vi.fn(),
  };

  it("renders the signed-in owner instead of hardcoded sample data", () => {
    render(<FileTable items={[file]} isLoading={false} {...baseProps} />);

    expect(screen.getByText("Alice Manager")).toBeInTheDocument();
    expect(screen.queryByText("Jane Davis")).not.toBeInTheDocument();
  });

  it("renders loading and empty states", () => {
    const { rerender } = render(
      <FileTable items={[]} isLoading={true} {...baseProps} />,
    );

    expect(screen.getByText("Loading documents...")).toBeInTheDocument();

    rerender(<FileTable items={[]} isLoading={false} {...baseProps} />);

    expect(
      screen.getByRole("heading", { name: "No documents here yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create a folder or upload files to start organizing this dataroom.",
      ),
    ).toBeInTheDocument();
  });

  it("exposes preview and download actions from the row menu", async () => {
    const onPreview = vi.fn();
    render(
      <FileTable
        items={[file]}
        isLoading={false}
        {...baseProps}
        onPreview={onPreview}
      />,
    );

    const actionsButton = screen.getByRole("button", { name: /open actions/i });
    actionsButton.focus();
    fireEvent.keyDown(actionsButton, { key: "Enter" });
    expect(
      await screen.findByRole("menuitem", { name: /download/i }),
    ).toHaveAttribute(
      "href",
      "http://localhost:3000/files/00000000-0000-0000-0000-000000000001/download",
    );
    fireEvent.click(screen.getByRole("menuitem", { name: /preview/i }));

    expect(onPreview).toHaveBeenCalledWith(file.file);
  });
});
