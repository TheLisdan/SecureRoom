export function contentDispositionAttachment(fileName: string): string {
  const asciiFallback = fileName
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(fileName);

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
