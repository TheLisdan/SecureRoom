import { useState } from "react";
import type { FileManagerItem, FileRecord } from "@secure-room/api-contract";

import type { NameDialogState } from "../files/NameDialog";

export function useWorkspaceState() {
  const [selectedDataroomId, setSelectedDataroomId] = useState<string | null>(
    null,
  );
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FileManagerItem | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [nameDialog, setNameDialog] = useState<NameDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<FileManagerItem | null>(
    null,
  );
  const [deleteDataroomDialogOpen, setDeleteDataroomDialogOpen] =
    useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [moveFile, setMoveFile] = useState<FileRecord | null>(null);

  return {
    selectedDataroomId,
    setSelectedDataroomId,
    currentFolderId,
    setCurrentFolderId,
    selectedItem,
    setSelectedItem,
    searchQuery,
    setSearchQuery,
    nameDialog,
    setNameDialog,
    deleteDialog,
    setDeleteDialog,
    deleteDataroomDialogOpen,
    setDeleteDataroomDialogOpen,
    previewFile,
    setPreviewFile,
    moveFile,
    setMoveFile,
  };
}

export type WorkspaceState = ReturnType<typeof useWorkspaceState>;
