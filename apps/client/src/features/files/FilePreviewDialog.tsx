import { Download } from "lucide-react";
import type { FileRecord } from "@secure-room/api-contract";

import { Button } from "../../components/ui/button";
import { api } from "../../lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { useFilePreview } from "./useFilePreview";

type FilePreviewDialogProps = {
  file: FileRecord | null;
  onOpenChange: (open: boolean) => void;
};

export function FilePreviewDialog({
  file,
  onOpenChange,
}: FilePreviewDialogProps) {
  const { previewKind, previewUrl, textPreview, error, isLoading } =
    useFilePreview(file);

  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[86vh] max-h-[calc(100vh-3rem)] w-[min(92vw,960px)] max-w-none grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0">
        <DialogHeader className="min-w-0 border-b p-4 pr-12">
          <DialogTitle
            className="truncate text-base font-semibold"
            title={file?.name ?? "File preview"}
          >
            {file?.name ?? "File preview"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Authenticated file preview.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 items-center justify-center overflow-hidden bg-background">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          ) : null}

          {(error || !previewKind) && file ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {error ?? "Preview is not available for this file type."}
              </p>
              <Button variant="outline" asChild>
                <a href={api.downloadUrl(file.id)}>
                  <Download data-icon="inline-start" />
                  Download
                </a>
              </Button>
            </div>
          ) : null}

          {previewKind === "pdf" && previewUrl ? (
            <iframe
              className="h-full w-full bg-white"
              src={previewUrl}
              title={`${file?.name ?? "File"} preview`}
            />
          ) : null}

          {previewKind === "image" && previewUrl ? (
            <img
              alt={file?.name ?? "Preview"}
              className="max-h-full max-w-full object-contain"
              src={previewUrl}
            />
          ) : null}

          {previewKind === "text" && textPreview !== null ? (
            <pre className="h-full w-full overflow-auto whitespace-pre-wrap bg-background p-5 text-left text-sm leading-6">
              {textPreview}
            </pre>
          ) : null}

          {previewKind === "audio" && previewUrl ? (
            <audio className="w-[min(80%,640px)]" controls src={previewUrl}>
              Audio preview is not supported by this browser.
            </audio>
          ) : null}

          {previewKind === "video" && previewUrl ? (
            <video
              className="max-h-full max-w-full bg-black"
              controls
              src={previewUrl}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
