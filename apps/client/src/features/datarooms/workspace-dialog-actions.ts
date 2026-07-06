import type {
  Dataroom,
  FileManagerItem,
  FileRecord,
} from "@secure-room/api-contract";

import type { FileManagerMutations } from "../files/queries";
import type { NameDialogState } from "../files/NameDialog";
import type { DataroomMutations } from "./queries";

type SubmitNameDialogInput = {
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

export function submitNameDialog({
  name,
  nameDialog,
  selectedDataroom,
  selectedDataroomId,
  currentFolderId,
  dataroomMutations,
  fileMutations,
  onCreatedDataroom,
  onClose,
}: SubmitNameDialogInput) {
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

type SubmitMoveFileInput = {
  file: FileRecord | null;
  folderId: string | null;
  fileMutations: FileManagerMutations;
  onMoved: () => void;
};

export function submitMoveFile({
  file,
  folderId,
  fileMutations,
  onMoved,
}: SubmitMoveFileInput) {
  if (!file) {
    return;
  }

  fileMutations.moveFile.mutate(
    { id: file.id, folderId },
    { onSuccess: onMoved },
  );
}

type SubmitItemDeleteInput = {
  item: FileManagerItem | null;
  selectedItem: FileManagerItem | null;
  fileMutations: FileManagerMutations;
  onDeletedSelectedItem: () => void;
  onClose: () => void;
};

export function submitItemDelete({
  item,
  selectedItem,
  fileMutations,
  onDeletedSelectedItem,
  onClose,
}: SubmitItemDeleteInput) {
  if (!item) {
    return;
  }

  const mutation =
    item.type === "folder"
      ? fileMutations.deleteFolder.mutate
      : fileMutations.deleteFile.mutate;

  mutation(item.id, {
    onSuccess: () => {
      if (selectedItem?.id === item.id) {
        onDeletedSelectedItem();
      }
      onClose();
    },
  });
}

type SubmitDataroomDeleteInput = {
  dataroom: Dataroom | null;
  datarooms: Dataroom[];
  dataroomMutations: DataroomMutations;
  onDeleted: (nextDataroomId: string | null) => void;
};

export function submitDataroomDelete({
  dataroom,
  datarooms,
  dataroomMutations,
  onDeleted,
}: SubmitDataroomDeleteInput) {
  if (!dataroom) {
    return;
  }

  const nextDataroomId =
    datarooms.find((candidate) => candidate.id !== dataroom.id)?.id ?? null;

  dataroomMutations.delete.mutate(dataroom.id, {
    onSuccess: () => onDeleted(nextDataroomId),
  });
}
