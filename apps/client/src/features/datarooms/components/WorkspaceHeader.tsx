import {
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import type { Dataroom, Folder } from "@secure-room/api-contract";

import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";

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
          <Breadcrumbs
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
                  placeholder="Search files and folders"
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

function DataroomActionsMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="shrink-0" variant="ghost" size="icon" type="button">
          <MoreHorizontal data-icon="inline-start" />
          <span className="sr-only">Open dataroom actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onRename}>
            <Pencil />
            Rename dataroom
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onSelect={onDelete}>
            <Trash2 />
            Delete dataroom
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Breadcrumbs({
  selectedDataroom,
  folderPath,
  onGoHome,
  onOpenFolder,
}: {
  selectedDataroom: Dataroom | null;
  folderPath: Folder[];
  onGoHome: () => void;
  onOpenFolder: (folderId: string) => void;
}) {
  return (
    <div className="mt-3 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-muted-foreground">
      <button
        type="button"
        onClick={onGoHome}
        className="shrink-0 hover:text-foreground"
      >
        Home
      </button>
      {selectedDataroom ? <span className="shrink-0">/</span> : null}
      {selectedDataroom ? (
        <span className="min-w-0 truncate" title={selectedDataroom.name}>
          {selectedDataroom.name}
        </span>
      ) : null}
      {folderPath.map((folder) => (
        <span
          key={folder.id}
          className="inline-flex min-w-0 items-center gap-2"
        >
          <span className="shrink-0">/</span>
          <button
            className="truncate font-medium text-primary hover:underline"
            type="button"
            onClick={() => onOpenFolder(folder.id)}
            title={folder.name}
          >
            {folder.name}
          </button>
        </span>
      ))}
    </div>
  );
}

function UploadButton({
  onUploadFiles,
}: {
  onUploadFiles: (files: File[]) => void;
}) {
  return (
    <Button
      asChild
      className="w-full cursor-pointer sm:w-auto"
      variant="outline"
    >
      <label>
        <input
          className="sr-only"
          type="file"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.currentTarget.value = "";
            if (files.length > 0) {
              onUploadFiles(files);
            }
          }}
        />
        <Upload data-icon="inline-start" />
        Upload files
      </label>
    </Button>
  );
}
