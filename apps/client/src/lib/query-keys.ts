export const queryKeys = {
  me: ["me"] as const,
  datarooms: ["datarooms"] as const,
  tree: (dataroomId: string) => ["dataroom-tree", dataroomId] as const,
  search: (dataroomId: string, query: string) =>
    ["search", dataroomId, query] as const,
};
