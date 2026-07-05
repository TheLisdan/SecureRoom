import { unsupportedMediaType } from "../common/domain-error.js";

const imagePreviewTypes = new Set([
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const textPreviewTypes = new Set([
  "application/json",
  "text/csv",
  "text/markdown",
  "text/plain",
  "text/tab-separated-values",
  "text/x-markdown",
]);

const markdownExtensions = new Set(["markdown", "md"]);

export function getPreviewContentType(
  mimeType: string,
  fileName?: string,
): string {
  const normalized = mimeType.trim().toLowerCase().split(";")[0] ?? "";

  if (normalized === "application/pdf") {
    return "application/pdf";
  }

  if (imagePreviewTypes.has(normalized)) {
    return normalized;
  }

  if (textPreviewTypes.has(normalized)) {
    return normalized.startsWith("text/")
      ? `${normalized}; charset=utf-8`
      : normalized;
  }

  if (normalized.startsWith("audio/") || normalized.startsWith("video/")) {
    return normalized;
  }

  if (fileName && markdownExtensions.has(getFileExtension(fileName))) {
    return "text/markdown; charset=utf-8";
  }

  throw unsupportedMediaType(
    "PREVIEW_UNAVAILABLE",
    "Preview is not available for this file type.",
  );
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
}
