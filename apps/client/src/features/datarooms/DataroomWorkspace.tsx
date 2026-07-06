import { useEffect } from "react";
import type { AuthUser, FileManagerItem } from "@secure-room/api-contract";

import { MobileDataroomNav } from "./components/MobileDataroomNav";
import { DataroomSidebar } from "./components/DataroomSidebar";
import { WorkspaceFilesPanel } from "./components/WorkspaceFilesPanel";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { WorkspaceDialogs } from "./components/WorkspaceDialogs";
import { FileDetailsPanel } from "../files/FileDetailsPanel";
import { useFileManagerMutations } from "../files/queries";
import { useFileUploadController } from "../files/useFileUploadController";
import { useAuthMutations } from "../auth/queries";
import { useWorkspaceState } from "./useWorkspaceState";
import { useWorkspaceView } from "./useWorkspaceView";
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
  const workspace = useWorkspaceState();
  const {
    selectedDataroomId,
    setSelectedDataroomId,
    currentFolderId,
    setCurrentFolderId,
    selectedItem,
    setSelectedItem,
    searchQuery,
    setSearchQuery,
    setNameDialog,
    setDeleteDialog,
    setDeleteDataroomDialogOpen,
    setPreviewFile,
    setMoveFile,
  } = workspace;
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
  }, [datarooms.data, selectedDataroomId, setSelectedDataroomId]);

  useEffect(() => {
    setCurrentFolderId(null);
    setSelectedItem(null);
    setSearchQuery("");
  }, [selectedDataroomId, setCurrentFolderId, setSearchQuery, setSelectedItem]);

  const tree = treeQuery.data;
  const dataroomList = datarooms.data ?? [];
  const {
    selectedDataroom,
    folderPath,
    isSearching,
    visibleItems,
    hasNoDatarooms,
  } = useWorkspaceView({
    datarooms: dataroomList,
    isDataroomsLoading: datarooms.isLoading,
    selectedDataroomId,
    tree,
    currentFolderId,
    searchQuery,
    searchResult: search.data,
  });

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

      <main className="flex min-w-0 flex-1 flex-col md:flex-row">
        <MobileDataroomNav
          user={user}
          datarooms={dataroomList}
          isLoading={datarooms.isLoading}
          selectedDataroomId={selectedDataroomId}
          onSelectDataroom={setSelectedDataroomId}
          onCreateDataroom={() => setNameDialog({ type: "createDataroom" })}
          onLogout={() => authMutations.logout.mutate()}
        />

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

          <WorkspaceFilesPanel
            hasNoDatarooms={hasNoDatarooms}
            selectedDataroomId={selectedDataroomId}
            uploadState={uploadState}
            uploadNotice={uploadNotice}
            uploadError={uploadError}
            items={visibleItems}
            isLoading={treeQuery.isLoading || search.isFetching}
            ownerName={user.name}
            isSearching={isSearching}
            selectedItemId={selectedItem?.id ?? null}
            onUploadFiles={(files) => void uploadFiles(files)}
            onCreateDataroom={() => setNameDialog({ type: "createDataroom" })}
            onSelectItem={setSelectedItem}
            onOpenItem={openItem}
            onPreview={setPreviewFile}
            onRename={(item) => setNameDialog({ type: "renameItem", item })}
            onMove={setMoveFile}
            onDelete={setDeleteDialog}
          />
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
        workspace={workspace}
        folders={tree?.folders ?? []}
        selectedDataroom={selectedDataroom}
        datarooms={dataroomList}
        dataroomMutations={dataroomMutations}
        fileMutations={fileMutations}
      />
    </div>
  );
}
