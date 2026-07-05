import type { FileRecord } from "@secure-room/api-contract";

export type PreviewKind = "audio" | "image" | "pdf" | "text" | "video";

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

export function getPreviewKind(
  file: Pick<FileRecord, "mimeType" | "name">,
): PreviewKind | null {
  const normalized = normalizeMimeType(file.mimeType);

  if (normalized === "application/pdf") {
    return "pdf";
  }

  if (imagePreviewTypes.has(normalized)) {
    return "image";
  }

  if (textPreviewTypes.has(normalized)) {
    return "text";
  }

  if (normalized.startsWith("audio/")) {
    return "audio";
  }

  if (normalized.startsWith("video/")) {
    return "video";
  }

  if (markdownExtensions.has(getFileExtension(file.name))) {
    return "text";
  }

  return null;
}

export function canPreviewFile(file: FileRecord): boolean {
  return getPreviewKind(file) !== null;
}

export function getFileTypeLabel(file: FileRecord): string {
  const normalized = normalizeMimeType(file.mimeType);

  if (normalized === "application/octet-stream") {
    return "File";
  }

  if (normalized === "application/pdf") {
    return "PDF document";
  }

  if (normalized.startsWith("image/")) {
    return "Image";
  }

  if (normalized.startsWith("audio/")) {
    return "Audio";
  }

  if (normalized.startsWith("video/")) {
    return "Video";
  }

  if (normalized.startsWith("text/") || normalized === "application/json") {
    return markdownExtensions.has(getFileExtension(file.name))
      ? "Markdown"
      : "Text";
  }

  if (markdownExtensions.has(getFileExtension(file.name))) {
    return "Markdown";
  }

  return normalized;
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase().split(";")[0] ?? "";
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
}
