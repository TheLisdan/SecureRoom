import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileManagerItem } from "@secure-room/api-contract";

import { Progress } from "../components/ui/progress";
import { ItemDeleteDialog } from "../features/files/ItemDeleteDialog";
import { NameDialog } from "../features/files/NameDialog";
import { UploadProgressRow } from "../features/files/UploadProgressRow";

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

describe("file dialogs and upload UI", () => {
  it("submits trimmed names from the rename dialog", () => {
    const onSubmit = vi.fn();

    render(
      <NameDialog
        state={{ type: "renameItem", item: fileItem }}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        error={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "  Updated disclosure.pdf  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith("Updated disclosure.pdf");
  });

  it("shows delete confirmation copy and calls confirm", () => {
    const onConfirm = vi.fn();

    render(
      <ItemDeleteDialog
        item={fileItem}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        error={new Error("Delete failed.")}
      />,
    );

    expect(
      screen.getByRole("alertdialog", { name: "Delete file" }),
    ).toBeVisible();
    expect(screen.getByText("Disclosure.pdf")).toBeVisible();
    expect(screen.getByText("Delete failed.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders upload progress with a stable bounded progress bar", () => {
    const { container } = render(
      <>
        <UploadProgressRow
          fileName="very-long-disclosure-file.pdf"
          progress={55}
        />
        <Progress value={150} />
      </>,
    );

    expect(
      screen.getByText("very-long-disclosure-file.pdf"),
    ).toBeInTheDocument();
    expect(screen.getByText("55% uploaded")).toBeInTheDocument();
    expect(container.querySelector('[style="width: 100%;"]')).toBeTruthy();
  });
});
