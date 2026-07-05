import {
  Download,
  Eye,
  FileText,
  Folder,
  FolderInput,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { FileManagerItem, FileRecord } from "@secure-room/api-contract";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "../../components/ui/empty";
import { Separator } from "../../components/ui/separator";
import { api } from "../../lib/api";
import { formatBytes, formatTimestamp } from "./file-manager-state";
import { canPreviewFile, getFileTypeLabel } from "./preview-support";

type FileDetailsPanelProps = {
  item: FileManagerItem | null;
  dataroomName: string;
  ownerName: string;
  onClose: () => void;
  onRename: (item: FileManagerItem) => void;
  onMove: (file: FileRecord) => void;
  onDelete: (item: FileManagerItem) => void;
  onPreview: (file: FileRecord) => void;
};

export function FileDetailsPanel({
  item,
  dataroomName,
  ownerName,
  onClose,
  onRename,
  onMove,
  onDelete,
  onPreview,
}: FileDetailsPanelProps) {
  const canPreviewSelectedFile =
    item?.type === "file" ? canPreviewFile(item.file) : false;

  return (
    <aside className="hidden w-80 shrink-0 border-l bg-background xl:block">
      {item ? (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between p-6">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                {item.type === "folder" ? (
                  <Folder className="size-6 text-warning-foreground" />
                ) : (
                  <FileText className="size-6 text-destructive" />
                )}
              </div>
              <div className="min-w-0">
                <h2
                  className="truncate text-base font-semibold leading-6"
                  title={item.name}
                >
                  {item.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.type === "folder"
                    ? "Folder"
                    : formatBytes(item.file.sizeBytes)}
                </p>
              </div>
            </div>
            <button
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              type="button"
              onClick={onClose}
            >
              <X className="size-4" />
              <span className="sr-only">Close details</span>
            </button>
          </div>

          <div className="px-6">
            <Badge variant="warning">Confidential</Badge>
          </div>

          <div className="flex flex-col gap-5 p-6 text-sm">
            <Detail
              label="Type"
              value={
                item.type === "folder" ? "Folder" : getFileTypeLabel(item.file)
              }
            />
            {item.type === "file" ? (
              <Detail label="Size" value={formatBytes(item.file.sizeBytes)} />
            ) : null}
            <Detail label="Location" value={dataroomName || "Data room"} />
            <Detail
              label="Last modified"
              value={formatTimestamp(item.updatedAt)}
            />
            <Detail label="Owner" value={ownerName} />
          </div>

          <Separator />

          <div className="flex flex-col gap-3 p-6">
            {item.type === "file" ? (
              <>
                {canPreviewSelectedFile ? (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => onPreview(item.file)}
                  >
                    <Eye data-icon="inline-start" />
                    Preview
                  </Button>
                ) : null}
                <Button variant="outline" asChild>
                  <a href={api.downloadUrl(item.id)}>
                    <Download data-icon="inline-start" />
                    Download
                  </a>
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onMove(item.file)}
                >
                  <FolderInput data-icon="inline-start" />
                  Move
                </Button>
              </>
            ) : null}
            <Button
              variant="outline"
              type="button"
              onClick={() => onRename(item)}
            >
              <Pencil data-icon="inline-start" />
              Rename
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={() => onDelete(item)}
            >
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <Empty className="h-full p-8">
          <EmptyMedia>
            <FileText className="size-6" />
          </EmptyMedia>
          <EmptyTitle className="text-sm">No item selected</EmptyTitle>
          <EmptyDescription>
            Select a file or folder to inspect metadata.
          </EmptyDescription>
        </Empty>
      )}
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium">{label}</dt>
      <dd className="mt-1 text-muted-foreground">{value}</dd>
    </div>
  );
}
