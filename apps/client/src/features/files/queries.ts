import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, uploadFile } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useFileManagerMutations(dataroomId: string) {
  const queryClient = useQueryClient();
  const refreshTree = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.tree(dataroomId),
    });
  };

  return {
    createFolder: useMutation({
      mutationFn: (input: { parentFolderId: string | null; name: string }) =>
        api.createFolder({ dataroomId, ...input }),
      onSuccess: refreshTree,
    }),
    renameFolder: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        api.renameFolder(id, name),
      onSuccess: refreshTree,
    }),
    deleteFolder: useMutation({
      mutationFn: api.deleteFolder,
      onSuccess: refreshTree,
    }),
    renameFile: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        api.renameFile(id, name),
      onSuccess: refreshTree,
    }),
    moveFile: useMutation({
      mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
        api.moveFile(id, folderId),
      onSuccess: refreshTree,
    }),
    deleteFile: useMutation({
      mutationFn: api.deleteFile,
      onSuccess: refreshTree,
    }),
    uploadFile: useMutation({
      mutationFn: uploadFile,
      onSuccess: refreshTree,
    }),
  };
}

export type FileManagerMutations = ReturnType<typeof useFileManagerMutations>;
