import { TextDecoder } from "node:util";

const searchableMimeTypes = new Set([
  "application/json",
  "text/csv",
  "text/markdown",
  "text/plain",
  "text/tab-separated-values",
  "text/x-markdown",
]);

const searchableExtensions = new Set(["csv", "json", "markdown", "md", "txt"]);
const maxIndexedBytes = 256 * 1024;
const maxIndexedCharacters = 64_000;

type ExtractSearchTextInput = {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

export function extractSearchText({
  fileName,
  mimeType,
  buffer,
}: ExtractSearchTextInput): string | null {
  if (!isSearchableTextFile(fileName, mimeType)) {
    return null;
  }

  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(
    buffer.subarray(0, maxIndexedBytes),
  );
  const normalized = decoded
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 0
    ? normalized.slice(0, maxIndexedCharacters)
    : null;
}

function isSearchableTextFile(fileName: string, mimeType: string): boolean {
  const normalizedMimeType = mimeType.trim().toLowerCase().split(";")[0] ?? "";

  return (
    searchableMimeTypes.has(normalizedMimeType) ||
    searchableExtensions.has(getFileExtension(fileName))
  );
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");

  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
}
