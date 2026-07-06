import type { Dataroom, Folder } from "@secure-room/api-contract";

type WorkspaceBreadcrumbsProps = {
  selectedDataroom: Dataroom | null;
  folderPath: Folder[];
  onGoHome: () => void;
  onOpenFolder: (folderId: string) => void;
};

export function WorkspaceBreadcrumbs({
  selectedDataroom,
  folderPath,
  onGoHome,
  onOpenFolder,
}: WorkspaceBreadcrumbsProps) {
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
