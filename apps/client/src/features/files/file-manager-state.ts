import type {
  DataroomTree,
  FileManagerItem,
  Folder,
  SearchResult,
} from "@secure-room/api-contract";

export type FolderDestination = {
  folderId: string | null;
  name: string;
  depth: number;
  path: string;
};

export function getItemsForFolder(
  tree: DataroomTree,
  folderId: string | null,
): FileManagerItem[] {
  const folders: FileManagerItem[] = tree.folders
    .filter((folder) => folder.parentFolderId === folderId)
    .map((folder) => ({
      type: "folder",
      id: folder.id,
      name: folder.name,
      parentFolderId: folder.parentFolderId,
      updatedAt: folder.updatedAt,
      folder,
    }));

  const files: FileManagerItem[] = tree.files
    .filter((file) => file.folderId === folderId)
    .map((file) => ({
      type: "file",
      id: file.id,
      name: file.name,
      folderId: file.folderId,
      updatedAt: file.updatedAt,
      file,
    }));

  return [...folders, ...files].sort(compareFileManagerItems);
}

export function getSearchItems(result: SearchResult): FileManagerItem[] {
  const folders = result.folders.map<FileManagerItem>((folder) => ({
    type: "folder",
    id: folder.id,
    name: folder.name,
    parentFolderId: folder.parentFolderId,
    updatedAt: folder.updatedAt,
    folder,
  }));

  const files = result.files.map<FileManagerItem>((file) => ({
    type: "file",
    id: file.id,
    name: file.name,
    folderId: file.folderId,
    updatedAt: file.updatedAt,
    file,
  }));

  return [...folders, ...files].sort(compareFileManagerItems);
}

export function getFolderPath(
  folders: Folder[],
  folderId: string | null,
): Folder[] {
  if (!folderId) {
    return [];
  }

  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: Folder[] = [];
  let current = byId.get(folderId);

  while (current) {
    path.unshift(current);
    current = current.parentFolderId
      ? byId.get(current.parentFolderId)
      : undefined;
  }

  return path;
}

export function getFolderItemCount(
  tree: DataroomTree,
  folderId: string,
): number {
  return (
    tree.folders.filter((folder) => folder.parentFolderId === folderId).length +
    tree.files.filter((file) => file.folderId === folderId).length
  );
}

export function buildFolderDestinations(
  folders: Folder[],
): FolderDestination[] {
  const childrenByParent = new Map<string | null, Folder[]>();

  for (const folder of folders) {
    const parentFolderId = folder.parentFolderId ?? null;
    const children = childrenByParent.get(parentFolderId) ?? [];
    children.push(folder);
    childrenByParent.set(parentFolderId, children);
  }

  for (const children of childrenByParent.values()) {
    children.sort((first, second) => first.name.localeCompare(second.name));
  }

  const destinations: FolderDestination[] = [
    { folderId: null, name: "Home", depth: 0, path: "Home" },
  ];
  const visited = new Set<string>();

  const visit = (
    parentFolderId: string | null,
    depth: number,
    path: string[],
  ) => {
    for (const folder of childrenByParent.get(parentFolderId) ?? []) {
      if (visited.has(folder.id)) {
        continue;
      }

      visited.add(folder.id);
      const folderPath = [...path, folder.name];
      destinations.push({
        folderId: folder.id,
        name: folder.name,
        depth,
        path: folderPath.join(" / "),
      });
      visit(folder.id, depth + 1, folderPath);
    }
  };

  visit(null, 1, ["Home"]);
  return destinations;
}

export function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = sizeBytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function compareFileManagerItems(
  first: FileManagerItem,
  second: FileManagerItem,
): number {
  if (first.type !== second.type) {
    return first.type === "folder" ? -1 : 1;
  }

  return first.name.localeCompare(second.name);
}
