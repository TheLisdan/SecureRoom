const mojibakeMarkerPattern = /[ÃÂÐÑ]/;

export function decodeMultipartFilename(fileName: string): string {
  if (!mojibakeMarkerPattern.test(fileName)) {
    return fileName;
  }

  const decoded = Buffer.from(fileName, "latin1").toString("utf8");

  if (decoded.includes("\uFFFD")) {
    return fileName;
  }

  return decoded;
}
