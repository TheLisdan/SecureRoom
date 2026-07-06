import { useEffect, useState } from "react";
import type { FileRecord } from "@secure-room/api-contract";

import { api } from "../../lib/api";
import { getPreviewKind } from "./preview-support";

const maxTextPreviewLength = 500_000;

export function useFilePreview(file: FileRecord | null) {
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

  return {
    previewKind,
    previewUrl,
    textPreview,
    error,
    isLoading,
  };
}

function truncateTextPreview(text: string): string {
  if (text.length <= maxTextPreviewLength) {
    return text;
  }

  return `${text.slice(0, maxTextPreviewLength)}\n\nPreview truncated. Download the file to view the full contents.`;
}
