import { normalizeSiblingName } from "../common/sibling-key.js";

const maxFileNameLength = 180;
const maxDeduplicationAttempts = 10_000;

export function dedupeFileName(
  requestedName: string,
  existingNames: readonly string[],
): string {
  const normalizedExistingNames = new Set(
    existingNames.map(normalizeSiblingName),
  );

  if (!normalizedExistingNames.has(normalizeSiblingName(requestedName))) {
    return requestedName;
  }

  for (let index = 1; index < maxDeduplicationAttempts; index += 1) {
    const candidate = withCopySuffix(requestedName, index);

    if (!normalizedExistingNames.has(normalizeSiblingName(candidate))) {
      return candidate;
    }
  }

  throw new Error("Could not find an available file name.");
}

function withCopySuffix(fileName: string, index: number): string {
  const { baseName, extension } = splitFileName(fileName);
  const suffix = ` (${index})`;
  const maxBaseLength = maxFileNameLength - suffix.length - extension.length;
  const trimmedBaseName = baseName.slice(0, Math.max(1, maxBaseLength)).trim();

  return `${trimmedBaseName}${suffix}${extension}`;
}

function splitFileName(fileName: string): {
  baseName: string;
  extension: string;
} {
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return { baseName: fileName, extension: "" };
  }

  return {
    baseName: fileName.slice(0, dotIndex),
    extension: fileName.slice(dotIndex),
  };
}
