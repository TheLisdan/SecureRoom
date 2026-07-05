import { fileNameSchema } from "@secure-room/api-contract";

import { badRequest } from "../common/domain-error.js";

const mimeTypePattern =
  /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i;
const storageExtensionPattern = /^[a-z0-9]{1,16}$/;
const mimeTypeByExtension = new Map([
  ["csv", "text/csv"],
  ["json", "application/json"],
  ["markdown", "text/markdown"],
  ["md", "text/markdown"],
  ["txt", "text/plain"],
]);

export type FileUploadCandidate = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type ValidatedUploadFile = {
  name: string;
  mimeType: string;
  storageExtension: string;
};

export function validateFileUpload(
  file: FileUploadCandidate,
  maxUploadBytes: number,
): ValidatedUploadFile {
  if (file.sizeBytes <= 0) {
    throw badRequest("EMPTY_FILE", "The uploaded file is empty.");
  }

  if (file.sizeBytes > maxUploadBytes) {
    throw badRequest(
      "FILE_TOO_LARGE",
      "The uploaded file is larger than the configured limit.",
    );
  }

  const parsedName = fileNameSchema.safeParse(file.originalName);
  if (!parsedName.success) {
    throw badRequest(
      "INVALID_FILE_NAME",
      "File name contains unsupported characters or is too long.",
    );
  }

  return {
    name: parsedName.data,
    mimeType: normalizeMimeType(file.mimeType, parsedName.data),
    storageExtension: getSafeStorageExtension(parsedName.data),
  };
}

function normalizeMimeType(mimeType: string, fileName: string): string {
  const normalized = mimeType.trim().toLowerCase().split(";")[0] ?? "";
  const inferredMimeType = inferMimeTypeFromExtension(fileName);

  if (normalized === "text/x-markdown") {
    return "text/markdown";
  }

  if (!mimeTypePattern.test(normalized) || normalized.length > 127) {
    return inferredMimeType ?? "application/octet-stream";
  }

  if (normalized === "application/octet-stream") {
    return inferredMimeType ?? normalized;
  }

  return normalized;
}

function getSafeStorageExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex + 1) : "";
  const normalized = extension.toLowerCase();

  return storageExtensionPattern.test(normalized) ? normalized : "bin";
}

function inferMimeTypeFromExtension(fileName: string): string | null {
  return mimeTypeByExtension.get(getSafeStorageExtension(fileName)) ?? null;
}
