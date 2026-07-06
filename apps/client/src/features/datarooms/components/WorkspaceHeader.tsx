import { FolderPlus, Plus, Search } from "lucide-react";
import type { Dataroom, Folder } from "@secure-room/api-contract";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { UploadButton } from "../../files/UploadButton";
import { DataroomActionsMenu } from "./DataroomActionsMenu";
import { WorkspaceBreadcrumbs } from "./WorkspaceBreadcrumbs";

type WorkspaceHeaderProps = {
  selectedDataroom: Dataroom | null;
  folderPath: Folder[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onGoHome: () => void;
  onOpenFolder: (folderId: string) => void;
  onCreateDataroom: () => void;
  onRenameDataroom: () => void;
  onDeleteDataroom: () => void;
  onCreateFolder: () => void;
  onUploadFiles: (files: File[]) => void;
};

export function WorkspaceHeader({
  selectedDataroom,
  folderPath,
  searchQuery,
  onSearchQueryChange,
  onGoHome,
  onOpenFolder,
  onCreateDataroom,
  onRenameDataroom,
  onDeleteDataroom,
  onCreateFolder,
  onUploadFiles,
}: WorkspaceHeaderProps) {
  return (
    <header className="border-b px-6 py-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h1
              className="truncate text-2xl font-semibold"
              title={selectedDataroom?.name ?? "Data Rooms"}
            >
              {selectedDataroom?.name ?? "Data Rooms"}
            </h1>
            {selectedDataroom ? (
              <DataroomActionsMenu
                onRename={onRenameDataroom}
                onDelete={onDeleteDataroom}
              />
            ) : null}
          </div>
          <WorkspaceBreadcrumbs
            selectedDataroom={selectedDataroom}
            folderPath={folderPath}
            onGoHome={onGoHome}
            onOpenFolder={onOpenFolder}
          />
        </div>

        <div className="w-full xl:max-w-xl">
          {selectedDataroom ? (
            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search names or text content"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <UploadButton onUploadFiles={onUploadFiles} />
                <Button
                  className="w-full sm:w-auto"
                  type="button"
                  onClick={onCreateFolder}
                >
                  <FolderPlus data-icon="inline-start" />
                  New folder
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" onClick={onCreateDataroom}>
              <Plus data-icon="inline-start" />
              Create dataroom
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
