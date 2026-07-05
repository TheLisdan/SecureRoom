import type {
  Dataroom,
  FileManagerItem,
  FileRecord,
  Folder,
} from "@secure-room/api-contract";

import { DataroomDeleteDialog } from "./DataroomDeleteDialog";
import { FilePreviewDialog } from "../../files/FilePreviewDialog";
import { ItemDeleteDialog } from "../../files/ItemDeleteDialog";
import { MoveFileDialog } from "../../files/MoveFileDialog";
import { NameDialog } from "../../files/NameDialog";
import type { FileManagerMutations } from "../../files/queries";
import type { DataroomMutations } from "../queries";

export type NameDialogState =
  | { type: "createDataroom" }
  | { type: "renameDataroom"; name: string }
  | { type: "createFolder" }
  | { type: "renameItem"; item: FileManagerItem };

type WorkspaceDialogsProps = {
  nameDialog: NameDialogState | null;
  deleteDialog: FileManagerItem | null;
  deleteDataroomDialogOpen: boolean;
  previewFile: FileRecord | null;
  moveFile: FileRecord | null;
  folders: Folder[];
  selectedDataroom: Dataroom | null;
  datarooms: Dataroom[];
  selectedDataroomId: string | null;
  currentFolderId: string | null;
  selectedItem: FileManagerItem | null;
  dataroomMutations: DataroomMutations;
  fileMutations: FileManagerMutations;
  setNameDialog: (state: NameDialogState | null) => void;
  setDeleteDialog: (item: FileManagerItem | null) => void;
  setDeleteDataroomDialogOpen: (open: boolean) => void;
  setPreviewFile: (file: FileRecord | null) => void;
  setMoveFile: (file: FileRecord | null) => void;
  setSelectedDataroomId: (id: string | null) => void;
  setCurrentFolderId: (id: string | null) => void;
  setSelectedItem: (item: FileManagerItem | null) => void;
};

export function WorkspaceDialogs({
  nameDialog,
  deleteDialog,
  deleteDataroomDialogOpen,
  previewFile,
  moveFile,
  folders,
  selectedDataroom,
  datarooms,
  selectedDataroomId,
  currentFolderId,
  selectedItem,
  dataroomMutations,
  fileMutations,
  setNameDialog,
  setDeleteDialog,
  setDeleteDataroomDialogOpen,
  setPreviewFile,
  setMoveFile,
  setSelectedDataroomId,
  setCurrentFolderId,
  setSelectedItem,
}: WorkspaceDialogsProps) {
  const closeNameDialog = () => setNameDialog(null);

  return (
    <>
      <NameDialog
        state={nameDialog}
        onOpenChange={(open) => {
          if (!open) {
            closeNameDialog();
          }
        }}
        onSubmit={(name) =>
          submitNameDialog({
            name,
            nameDialog,
            selectedDataroom,
            selectedDataroomId,
            currentFolderId,
            dataroomMutations,
            fileMutations,
            onCreatedDataroom: setSelectedDataroomId,
            onClose: closeNameDialog,
          })
        }
        error={
          dataroomMutations.create.error ??
          dataroomMutations.rename.error ??
          fileMutations.createFolder.error ??
          fileMutations.renameFolder.error ??
          fileMutations.renameFile.error
        }
      />

      <MoveFileDialog
        file={moveFile}
        folders={folders}
        isPending={fileMutations.moveFile.isPending}
        error={fileMutations.moveFile.error}
        onOpenChange={(open) => {
          if (!open) {
            setMoveFile(null);
          }
        }}
        onSubmit={(folderId) => {
          if (!moveFile) {
            return;
          }

          fileMutations.moveFile.mutate(
            { id: moveFile.id, folderId },
            {
              onSuccess: () => {
                setSelectedItem(null);
                setMoveFile(null);
              },
            },
          );
        }}
      />

      <ItemDeleteDialog
        item={deleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog(null);
          }
        }}
        onConfirm={() => {
          if (!deleteDialog) {
            return;
          }

          const mutation =
            deleteDialog.type === "folder"
              ? fileMutations.deleteFolder.mutate
              : fileMutations.deleteFile.mutate;
          mutation(deleteDialog.id, {
            onSuccess: () => {
              if (selectedItem?.id === deleteDialog.id) {
                setSelectedItem(null);
              }
              setDeleteDialog(null);
            },
          });
        }}
        error={
          fileMutations.deleteFolder.error ?? fileMutations.deleteFile.error
        }
      />

      <DataroomDeleteDialog
        dataroom={selectedDataroom}
        open={deleteDataroomDialogOpen}
        isPending={dataroomMutations.delete.isPending}
        error={dataroomMutations.delete.error}
        onOpenChange={setDeleteDataroomDialogOpen}
        onConfirm={() => {
          if (!selectedDataroom) {
            return;
          }

          const nextDataroomId =
            datarooms.find((dataroom) => dataroom.id !== selectedDataroom.id)
              ?.id ?? null;

          dataroomMutations.delete.mutate(selectedDataroom.id, {
            onSuccess: () => {
              setSelectedDataroomId(nextDataroomId);
              setSelectedItem(null);
              setCurrentFolderId(null);
              setDeleteDataroomDialogOpen(false);
            },
          });
        }}
      />

      <FilePreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </>
  );
}

type NameDialogSubmitInput = {
  name: string;
  nameDialog: NameDialogState | null;
  selectedDataroom: Dataroom | null;
  selectedDataroomId: string | null;
  currentFolderId: string | null;
  dataroomMutations: DataroomMutations;
  fileMutations: FileManagerMutations;
  onCreatedDataroom: (id: string) => void;
  onClose: () => void;
};

function submitNameDialog({
  name,
  nameDialog,
  selectedDataroom,
  selectedDataroomId,
  currentFolderId,
  dataroomMutations,
  fileMutations,
  onCreatedDataroom,
  onClose,
}: NameDialogSubmitInput) {
  if (!nameDialog) {
    return;
  }

  if (nameDialog.type === "createDataroom") {
    dataroomMutations.create.mutate(name, {
      onSuccess: (dataroom) => {
        onCreatedDataroom(dataroom.id);
        onClose();
      },
    });
    return;
  }

  if (nameDialog.type === "renameDataroom" && selectedDataroom) {
    dataroomMutations.rename.mutate(
      { id: selectedDataroom.id, name },
      { onSuccess: onClose },
    );
    return;
  }

  if (nameDialog.type === "createFolder" && selectedDataroomId) {
    fileMutations.createFolder.mutate(
      { parentFolderId: currentFolderId, name },
      { onSuccess: onClose },
    );
    return;
  }

  if (nameDialog.type === "renameItem") {
    const item = nameDialog.item;
    const mutation =
      item.type === "folder"
        ? fileMutations.renameFolder.mutate
        : fileMutations.renameFile.mutate;
    mutation({ id: item.id, name }, { onSuccess: onClose });
  }
}
