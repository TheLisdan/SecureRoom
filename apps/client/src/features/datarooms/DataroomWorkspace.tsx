import { useEffect, useMemo, useState } from "react";
import type {
  AuthUser,
  FileManagerItem,
  FileRecord,
} from "@secure-room/api-contract";

import { DataroomDeleteDialog } from "./components/DataroomDeleteDialog";
import { DataroomEmptyState } from "./components/DataroomEmptyState";
import { DataroomSidebar } from "./components/DataroomSidebar";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import {
  WorkspaceDialogs,
  type NameDialogState,
} from "./components/WorkspaceDialogs";
import { FileDetailsPanel } from "../files/FileDetailsPanel";
import { FileDropZone } from "../files/FileDropZone";
import { FileTable } from "../files/FileTable";
import {
  getFolderPath,
  getItemsForFolder,
  getSearchItems,
} from "../files/file-manager-state";
import { useFileManagerMutations } from "../files/queries";
import { useFileUploadController } from "../files/useFileUploadController";
import { useAuthMutations } from "../auth/queries";
import {
  useDataroomMutations,
  useDataroomTree,
  useDatarooms,
  useSearch,
} from "./queries";

type WorkspaceProps = {
  user: AuthUser;
};

export function DataroomWorkspace({ user }: WorkspaceProps) {
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

  const authMutations = useAuthMutations();
  const datarooms = useDatarooms();
  const dataroomMutations = useDataroomMutations();
  const treeQuery = useDataroomTree(selectedDataroomId);
  const fileMutations = useFileManagerMutations(selectedDataroomId ?? "");
  const search = useSearch(selectedDataroomId, searchQuery);
  const { uploadFiles, uploadState, uploadNotice, uploadError } =
    useFileUploadController({
      selectedDataroomId,
      currentFolderId,
      fileMutations,
    });

  useEffect(() => {
    if (!selectedDataroomId && datarooms.data?.[0]) {
      setSelectedDataroomId(datarooms.data[0].id);
    }
  }, [datarooms.data, selectedDataroomId]);

  useEffect(() => {
    setCurrentFolderId(null);
    setSelectedItem(null);
    setSearchQuery("");
  }, [selectedDataroomId]);

  const tree = treeQuery.data;
  const dataroomList = datarooms.data ?? [];
  const selectedDataroom =
    dataroomList.find((dataroom) => dataroom.id === selectedDataroomId) ?? null;
  const folderPath = useMemo(
    () => (tree ? getFolderPath(tree.folders, currentFolderId) : []),
    [currentFolderId, tree],
  );
  const isSearching = Boolean(searchQuery.trim());
  const visibleItems = useMemo(() => {
    if (!tree) {
      return [];
    }

    if (isSearching && search.data) {
      return getSearchItems(search.data);
    }

    return getItemsForFolder(tree, currentFolderId);
  }, [currentFolderId, isSearching, search.data, tree]);
  const hasNoDatarooms = !datarooms.isLoading && dataroomList.length === 0;

  const openItem = (item: FileManagerItem) => {
    setSelectedItem(item);

    if (item.type === "folder") {
      setCurrentFolderId(item.id);
      setSearchQuery("");
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DataroomSidebar
        user={user}
        datarooms={dataroomList}
        isLoading={datarooms.isLoading}
        selectedDataroomId={selectedDataroomId}
        onSelectDataroom={setSelectedDataroomId}
        onCreateDataroom={() => setNameDialog({ type: "createDataroom" })}
        onLogout={() => authMutations.logout.mutate()}
      />

      <main className="flex min-w-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <WorkspaceHeader
            selectedDataroom={selectedDataroom}
            folderPath={folderPath}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onGoHome={() => setCurrentFolderId(null)}
            onOpenFolder={setCurrentFolderId}
            onCreateDataroom={() => setNameDialog({ type: "createDataroom" })}
            onRenameDataroom={() => {
              if (selectedDataroom) {
                setNameDialog({
                  type: "renameDataroom",
                  name: selectedDataroom.name,
                });
              }
            }}
            onDeleteDataroom={() => setDeleteDataroomDialogOpen(true)}
            onCreateFolder={() => setNameDialog({ type: "createFolder" })}
            onUploadFiles={(files) => void uploadFiles(files)}
          />

          {hasNoDatarooms ? (
            <DataroomEmptyState
              onCreateDataroom={() => setNameDialog({ type: "createDataroom" })}
            />
          ) : (
            <FileDropZone
              enabled={Boolean(selectedDataroomId)}
              uploadState={uploadState}
              uploadNotice={uploadNotice}
              uploadError={uploadError}
              onUploadFiles={(files) => void uploadFiles(files)}
            >
              <FileTable
                items={visibleItems}
                isLoading={treeQuery.isLoading || search.isFetching}
                ownerName={user.name}
                emptyTitle={
                  isSearching
                    ? "No matching files or folders"
                    : "No documents here yet"
                }
                emptyDescription={
                  isSearching
                    ? "Try a different search term or clear the search field."
                    : "Create a folder or upload files to start organizing this dataroom."
                }
                selectedItemId={selectedItem?.id ?? null}
                onSelectItem={setSelectedItem}
                onOpenItem={openItem}
                onPreview={setPreviewFile}
                onRename={(item) => setNameDialog({ type: "renameItem", item })}
                onMove={setMoveFile}
                onDelete={setDeleteDialog}
              />
            </FileDropZone>
          )}
        </section>

        <FileDetailsPanel
          item={selectedItem}
          dataroomName={selectedDataroom?.name ?? ""}
          ownerName={user.name}
          onClose={() => setSelectedItem(null)}
          onRename={(item) => setNameDialog({ type: "renameItem", item })}
          onMove={setMoveFile}
          onDelete={setDeleteDialog}
          onPreview={setPreviewFile}
        />
      </main>

      <WorkspaceDialogs
        nameDialog={nameDialog}
        deleteDialog={deleteDialog}
        deleteDataroomDialogOpen={deleteDataroomDialogOpen}
        previewFile={previewFile}
        moveFile={moveFile}
        folders={tree?.folders ?? []}
        selectedDataroom={selectedDataroom}
        datarooms={dataroomList}
        selectedDataroomId={selectedDataroomId}
        currentFolderId={currentFolderId}
        selectedItem={selectedItem}
        dataroomMutations={dataroomMutations}
        fileMutations={fileMutations}
        setNameDialog={setNameDialog}
        setDeleteDialog={setDeleteDialog}
        setDeleteDataroomDialogOpen={setDeleteDataroomDialogOpen}
        setPreviewFile={setPreviewFile}
        setMoveFile={setMoveFile}
        setSelectedDataroomId={setSelectedDataroomId}
        setCurrentFolderId={setCurrentFolderId}
        setSelectedItem={setSelectedItem}
      />
    </div>
  );
}
