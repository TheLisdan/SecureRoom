import {
  Download,
  Eye,
  FolderInput,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { FileManagerItem, FileRecord } from "@secure-room/api-contract";

import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { api } from "../../lib/api";
import { canPreviewFile } from "./preview-support";

type FileRowActionsProps = {
  item: FileManagerItem;
  onPreview: (file: FileRecord) => void;
  onRename: (item: FileManagerItem) => void;
  onMove: (file: FileRecord) => void;
  onDelete: (item: FileManagerItem) => void;
};

export function FileRowActions({
  item,
  onPreview,
  onRename,
  onMove,
  onDelete,
}: FileRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal data-icon="inline-start" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {item.type === "file" && canPreviewFile(item.file) ? (
            <DropdownMenuItem onSelect={() => onPreview(item.file)}>
              <Eye />
              Preview
            </DropdownMenuItem>
          ) : null}
          {item.type === "file" ? (
            <DropdownMenuItem asChild>
              <a href={api.downloadUrl(item.id)}>
                <Download />
                Download
              </a>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => onRename(item)}>
            <Pencil />
            Rename
          </DropdownMenuItem>
          {item.type === "file" ? (
            <DropdownMenuItem onSelect={() => onMove(item.file)}>
              <FolderInput />
              Move
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => onDelete(item)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
