import { useEffect, useState } from "react";
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
import { getPreviewKind } from "./preview-support";

const maxTextPreviewLength = 500_000;

type FilePreviewDialogProps = {
  file: FileRecord | null;
  onOpenChange: (open: boolean) => void;
};

export function FilePreviewDialog({
  file,
  onOpenChange,
}: FilePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const previewKind = file ? getPreviewKind(file) : null;

  useEffect(() => {
    if (!file || !previewKind) {
      setPreviewUrl(null);
      setTextPreview(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const currentFile = file;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    let isActive = true;

    setPreviewUrl(null);
    setTextPreview(null);
    setError(null);
    setIsLoading(true);

    async function loadPreview() {
      try {
        const response = await fetch(api.previewUrl(currentFile.id), {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Preview failed.");
        }

        if (previewKind === "text") {
          const text = await response.text();
          if (isActive) {
            setTextPreview(truncateTextPreview(text));
          }
          return;
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(
          new Blob([blob], {
            type: response.headers.get("Content-Type") ?? currentFile.mimeType,
          }),
        );

        if (isActive) {
          setPreviewUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (loadError) {
        const isAbortError =
          loadError instanceof Error && loadError.name === "AbortError";
        if (isActive && !isAbortError) {
          setError("Preview is unavailable. You can still download the file.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isActive = false;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file, previewKind]);

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

function truncateTextPreview(text: string): string {
  if (text.length <= maxTextPreviewLength) {
    return text;
  }

  return `${text.slice(0, maxTextPreviewLength)}\n\nPreview truncated. Download the file to view the full contents.`;
}
