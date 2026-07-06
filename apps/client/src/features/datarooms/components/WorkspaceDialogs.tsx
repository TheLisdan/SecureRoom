import type { Dataroom, Folder } from "@secure-room/api-contract";

import { DataroomDeleteDialog } from "./DataroomDeleteDialog";
import { FilePreviewDialog } from "../../files/FilePreviewDialog";
import { ItemDeleteDialog } from "../../files/ItemDeleteDialog";
import { MoveFileDialog } from "../../files/MoveFileDialog";
import { NameDialog } from "../../files/NameDialog";
import type { FileManagerMutations } from "../../files/queries";
import {
  submitDataroomDelete,
  submitItemDelete,
  submitMoveFile,
  submitNameDialog,
} from "../workspace-dialog-actions";
import type { WorkspaceState } from "../useWorkspaceState";
import type { DataroomMutations } from "../queries";

type WorkspaceDialogsProps = {
  workspace: WorkspaceState;
  folders: Folder[];
  selectedDataroom: Dataroom | null;
  datarooms: Dataroom[];
  dataroomMutations: DataroomMutations;
  fileMutations: FileManagerMutations;
};

export function WorkspaceDialogs({
  workspace,
  folders,
  selectedDataroom,
  datarooms,
  dataroomMutations,
  fileMutations,
}: WorkspaceDialogsProps) {
  const {
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
    selectedDataroomId,
    setSelectedDataroomId,
    currentFolderId,
    setCurrentFolderId,
    selectedItem,
    setSelectedItem,
  } = workspace;
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
        onSubmit={(folderId) =>
          submitMoveFile({
            file: moveFile,
            folderId,
            fileMutations,
            onMoved: () => {
              setSelectedItem(null);
              setMoveFile(null);
            },
          })
        }
      />

      <ItemDeleteDialog
        item={deleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog(null);
          }
        }}
        onConfirm={() =>
          submitItemDelete({
            item: deleteDialog,
            selectedItem,
            fileMutations,
            onDeletedSelectedItem: () => setSelectedItem(null),
            onClose: () => setDeleteDialog(null),
          })
        }
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
        onConfirm={() =>
          submitDataroomDelete({
            dataroom: selectedDataroom,
            datarooms,
            dataroomMutations,
            onDeleted: (nextDataroomId) => {
              setSelectedDataroomId(nextDataroomId);
              setSelectedItem(null);
              setCurrentFolderId(null);
              setDeleteDataroomDialogOpen(false);
            },
          })
        }
      />

      <FilePreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </>
  );
}
