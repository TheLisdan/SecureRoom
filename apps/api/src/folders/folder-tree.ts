import type { Folder } from "@secure-room/api-contract";

export function collectDescendantFolderIds(
  folders: Pick<Folder, "id" | "parentFolderId">[],
  rootId: string,
): string[] {
  const childrenByParent = new Map<string, string[]>();

  for (const folder of folders) {
    if (!folder.parentFolderId) {
      continue;
    }

    const children = childrenByParent.get(folder.parentFolderId) ?? [];
    children.push(folder.id);
    childrenByParent.set(folder.parentFolderId, children);
  }

  const ids = [rootId];
  const queue = [rootId];

  for (const currentId of queue) {
    const childIds = childrenByParent.get(currentId) ?? [];
    for (const childId of childIds) {
      ids.push(childId);
      queue.push(childId);
    }
  }

  return ids;
}
