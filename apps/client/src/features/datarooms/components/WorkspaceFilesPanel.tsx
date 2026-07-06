import type { FileManagerItem, FileRecord } from "@secure-room/api-contract";

import { FileDropZone } from "../../files/FileDropZone";
import { FileTable } from "../../files/FileTable";
import type { UploadState } from "../../files/useFileUploadController";
import { DataroomEmptyState } from "./DataroomEmptyState";

type WorkspaceFilesPanelProps = {
  hasNoDatarooms: boolean;
  selectedDataroomId: string | null;
  uploadState: UploadState | null;
  uploadNotice: string | null;
  uploadError: unknown;
  items: FileManagerItem[];
  isLoading: boolean;
  ownerName: string;
  isSearching: boolean;
  selectedItemId: string | null;
  onUploadFiles: (files: File[]) => void;
  onCreateDataroom: () => void;
  onSelectItem: (item: FileManagerItem) => void;
  onOpenItem: (item: FileManagerItem) => void;
  onPreview: (file: FileRecord) => void;
  onRename: (item: FileManagerItem) => void;
  onMove: (file: FileRecord) => void;
  onDelete: (item: FileManagerItem) => void;
};

export function WorkspaceFilesPanel({
  hasNoDatarooms,
  selectedDataroomId,
  uploadState,
  uploadNotice,
  uploadError,
  items,
  isLoading,
  ownerName,
  isSearching,
  selectedItemId,
  onUploadFiles,
  onCreateDataroom,
  onSelectItem,
  onOpenItem,
  onPreview,
  onRename,
  onMove,
  onDelete,
}: WorkspaceFilesPanelProps) {
  if (hasNoDatarooms) {
    return <DataroomEmptyState onCreateDataroom={onCreateDataroom} />;
  }

  return (
    <FileDropZone
      enabled={Boolean(selectedDataroomId)}
      uploadState={uploadState}
      uploadNotice={uploadNotice}
      uploadError={uploadError}
      onUploadFiles={onUploadFiles}
    >
      <FileTable
        items={items}
        isLoading={isLoading}
        ownerName={ownerName}
        emptyTitle={
          isSearching ? "No matching files or folders" : "No documents here yet"
        }
        emptyDescription={
          isSearching
            ? "Try a different search term or clear the search field."
            : "Create a folder or upload files to start organizing this dataroom."
        }
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
        onOpenItem={onOpenItem}
        onPreview={onPreview}
        onRename={onRename}
        onMove={onMove}
        onDelete={onDelete}
      />
    </FileDropZone>
  );
}
