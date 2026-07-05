import { useEffect, useState } from "react";
import type { DragEvent, ReactNode } from "react";

import { Alert, AlertDescription } from "../../components/ui/alert";
import { getErrorMessage } from "../../lib/api-error";
import { UploadProgressRow } from "./UploadProgressRow";

type FileDropZoneProps = {
  enabled: boolean;
  uploadState: { fileName: string; progress: number } | null;
  uploadNotice: string | null;
  uploadError: unknown;
  onUploadFiles: (files: File[]) => void;
  children: ReactNode;
};

export function FileDropZone({
  enabled,
  uploadState,
  uploadNotice,
  uploadError,
  onUploadFiles,
  children,
}: FileDropZoneProps) {
  const [dragDepth, setDragDepth] = useState(0);

  useEffect(() => {
    const preventFileDropNavigation = (event: globalThis.DragEvent) => {
      if (event.dataTransfer && hasDraggedFileTypes(event.dataTransfer.types)) {
        event.preventDefault();
      }
    };

    window.addEventListener("dragover", preventFileDropNavigation);
    window.addEventListener("drop", preventFileDropNavigation);

    return () => {
      window.removeEventListener("dragover", preventFileDropNavigation);
      window.removeEventListener("drop", preventFileDropNavigation);
    };
  }, []);

  useEffect(() => {
    setDragDepth(0);
  }, [enabled]);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!enabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setDragDepth((current) => current + 1);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!enabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!enabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setDragDepth((current) => Math.max(0, current - 1));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!enabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setDragDepth(0);
    onUploadFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <>
      {uploadError ? (
        <Alert className="mx-6 mt-4" variant="destructive">
          <AlertDescription>{getErrorMessage(uploadError)}</AlertDescription>
        </Alert>
      ) : null}
      {uploadNotice ? (
        <Alert className="mx-6 mt-4">
          <AlertDescription>{uploadNotice}</AlertDescription>
        </Alert>
      ) : null}

      <div
        className="relative flex min-h-0 flex-1 flex-col px-6 py-4"
        data-testid="dataroom-drop-target"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {dragDepth > 0 ? (
          <div className="pointer-events-none absolute inset-6 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-background/95 text-sm font-medium text-primary shadow-panel">
            Drop files to upload
          </div>
        ) : null}

        {uploadState ? (
          <UploadProgressRow
            fileName={uploadState.fileName}
            progress={uploadState.progress}
          />
        ) : null}

        {children}
      </div>
    </>
  );
}

function hasDraggedFiles(event: DragEvent<HTMLElement>) {
  return hasDraggedFileTypes(event.dataTransfer.types);
}

function hasDraggedFileTypes(types: DOMStringList | readonly string[]) {
  return Array.from(types).some(
    (type) => type === "Files" || type === "application/x-moz-file",
  );
}
