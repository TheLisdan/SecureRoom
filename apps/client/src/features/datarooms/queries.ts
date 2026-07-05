import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useDatarooms() {
  return useQuery({
    queryKey: queryKeys.datarooms,
    queryFn: api.listDatarooms,
  });
}

export function useDataroomTree(dataroomId: string | null) {
  return useQuery({
    queryKey: dataroomId
      ? queryKeys.tree(dataroomId)
      : ["dataroom-tree", "none"],
    queryFn: () => api.getTree(dataroomId ?? ""),
    enabled: Boolean(dataroomId),
  });
}

export function useSearch(dataroomId: string | null, query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: dataroomId
      ? queryKeys.search(dataroomId, normalizedQuery)
      : ["search", "none", normalizedQuery],
    queryFn: () => api.search(dataroomId ?? "", normalizedQuery),
    enabled: Boolean(dataroomId && normalizedQuery),
  });
}

export function useDataroomMutations() {
  const queryClient = useQueryClient();

  return {
    create: useMutation({
      mutationFn: api.createDataroom,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.datarooms });
      },
    }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        api.renameDataroom(id, name),
      onSuccess: async (dataroom) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.datarooms }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.tree(dataroom.id),
          }),
        ]);
      },
    }),
    delete: useMutation({
      mutationFn: api.deleteDataroom,
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.datarooms });
      },
    }),
  };
}

export type DataroomMutations = ReturnType<typeof useDataroomMutations>;
