import { Check, Folder, Home } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  FileRecord,
  Folder as FolderRecord,
} from "@secure-room/api-contract";

import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { getErrorMessage } from "../../lib/api-error";
import { cn } from "../../lib/cn";
import { buildFolderDestinations } from "./file-manager-state";

type MoveFileDialogProps = {
  file: FileRecord | null;
  folders: FolderRecord[];
  isPending: boolean;
  error: unknown;
  onOpenChange: (open: boolean) => void;
  onSubmit: (folderId: string | null) => void;
};

export function MoveFileDialog({
  file,
  folders,
  isPending,
  error,
  onOpenChange,
  onSubmit,
}: MoveFileDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const destinations = useMemo(
    () => buildFolderDestinations(folders),
    [folders],
  );

  useEffect(() => {
    setSelectedFolderId(file?.folderId ?? null);
  }, [file]);

  const isSameDestination = selectedFolderId === (file?.folderId ?? null);

  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,560px)]">
        <DialogHeader>
          <DialogTitle>Move file</DialogTitle>
          <DialogDescription>
            Choose the folder where this file should live.
          </DialogDescription>
        </DialogHeader>

        <div className="my-5">
          <div
            className="mb-3 truncate rounded-md bg-muted px-3 py-2 text-sm font-medium"
            title={file?.name}
          >
            {file?.name}
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border">
            {destinations.map((destination) => {
              const isSelected = selectedFolderId === destination.folderId;
              const isCurrent = file?.folderId === destination.folderId;
              const Icon = destination.folderId ? Folder : Home;

              return (
                <button
                  key={destination.folderId ?? "root"}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-3 border-b px-3 py-3 text-left text-sm last:border-0 hover:bg-muted",
                    isSelected && "bg-muted",
                  )}
                  type="button"
                  title={destination.path}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedFolderId(destination.folderId)}
                >
                  <span
                    className="flex min-w-0 flex-1 items-center gap-3"
                    style={{ paddingLeft: destination.depth * 16 }}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">{destination.name}</span>
                  </span>
                  {isCurrent ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Current
                    </span>
                  ) : null}
                  {isSelected ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-destructive">
            {getErrorMessage(error)}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!file || isPending || isSameDestination}
            onClick={() => onSubmit(selectedFolderId)}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
