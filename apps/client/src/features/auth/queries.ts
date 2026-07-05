import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: api.me,
  });
}

export function useAuthMutations() {
  const queryClient = useQueryClient();

  const finishAuth = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    await queryClient.invalidateQueries({ queryKey: queryKeys.datarooms });
  };

  return {
    login: useMutation({
      mutationFn: api.login,
      onSuccess: finishAuth,
    }),
    register: useMutation({
      mutationFn: api.register,
      onSuccess: finishAuth,
    }),
    logout: useMutation({
      mutationFn: api.logout,
      onSuccess: () => {
        queryClient.setQueryData(queryKeys.me, null);
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] !== queryKeys.me[0],
        });
      },
    }),
  };
}

export type AuthMutations = ReturnType<typeof useAuthMutations>;
