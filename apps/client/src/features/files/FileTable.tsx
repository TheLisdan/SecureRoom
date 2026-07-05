import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Folder } from "lucide-react";
import { useMemo } from "react";
import type { FileManagerItem, FileRecord } from "@secure-room/api-contract";

import { cn } from "../../lib/cn";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "../../components/ui/empty";
import { FileRowActions } from "./FileRowActions";
import { FileTableSkeleton } from "./FileTableSkeleton";
import { formatBytes, formatTimestamp } from "./file-manager-state";

type FileTableProps = {
  items: FileManagerItem[];
  isLoading: boolean;
  ownerName: string;
  emptyTitle?: string;
  emptyDescription?: string;
  selectedItemId: string | null;
  onSelectItem: (item: FileManagerItem) => void;
  onOpenItem: (item: FileManagerItem) => void;
  onPreview: (file: FileRecord) => void;
  onRename: (item: FileManagerItem) => void;
  onMove: (file: FileRecord) => void;
  onDelete: (item: FileManagerItem) => void;
};

export function FileTable({
  items,
  isLoading,
  ownerName,
  emptyTitle = "No documents here yet",
  emptyDescription = "Create a folder or upload files to start organizing this dataroom.",
  selectedItemId,
  onSelectItem,
  onOpenItem,
  onPreview,
  onRename,
  onMove,
  onDelete,
}: FileTableProps) {
  const columns = useMemo<ColumnDef<FileManagerItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const item = row.original;
          const Icon = item.type === "folder" ? Folder : FileText;
          return (
            <button
              className="flex w-full min-w-0 items-center gap-3 text-left"
              type="button"
              onClick={() => onOpenItem(item)}
              title={item.name}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md",
                  item.type === "folder"
                    ? "bg-warning/15 text-warning-foreground"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="truncate font-medium">{item.name}</span>
            </button>
          );
        },
      },
      {
        id: "updatedAt",
        header: "Last modified",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatTimestamp(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "owner",
        header: "Owner",
        cell: () => <span className="text-muted-foreground">{ownerName}</span>,
      },
      {
        id: "size",
        header: "Size",
        cell: ({ row }) =>
          row.original.type === "file" ? (
            <span className="text-muted-foreground">
              {formatBytes(row.original.file.sizeBytes)}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          return (
            <FileRowActions
              item={row.original}
              onPreview={onPreview}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
            />
          );
        },
      },
    ],
    [onDelete, onMove, onOpenItem, onPreview, onRename, ownerName],
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <FileTableSkeleton />;
  }

  if (items.length === 0) {
    return (
      <Empty className="rounded-lg border border-dashed">
        <EmptyMedia>
          <Folder className="size-6" />
        </EmptyMedia>
        <EmptyTitle>{emptyTitle}</EmptyTitle>
        <EmptyDescription>{emptyDescription}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <table className="w-full table-fixed text-sm">
        <thead className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    "px-4 py-3 first:w-[46%]",
                    header.column.id === "actions" && "w-14 px-2",
                  )}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "cursor-pointer border-b last:border-0 hover:bg-accent/50",
                selectedItemId === row.original.id && "bg-accent",
              )}
              onClick={() => onSelectItem(row.original)}
              onDoubleClick={() => onOpenItem(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    "px-4 py-3",
                    cell.column.id === "actions"
                      ? "overflow-visible px-2 text-right"
                      : "truncate",
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
