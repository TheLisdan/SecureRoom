import { useMemo } from "react";
import type {
  Dataroom,
  DataroomTree,
  SearchResult,
} from "@secure-room/api-contract";

import {
  getFolderPath,
  getItemsForFolder,
  getSearchItems,
} from "../files/file-manager-state";

type UseWorkspaceViewInput = {
  datarooms: Dataroom[];
  isDataroomsLoading: boolean;
  selectedDataroomId: string | null;
  tree: DataroomTree | undefined;
  currentFolderId: string | null;
  searchQuery: string;
  searchResult: SearchResult | undefined;
};

export function useWorkspaceView({
  datarooms,
  isDataroomsLoading,
  selectedDataroomId,
  tree,
  currentFolderId,
  searchQuery,
  searchResult,
}: UseWorkspaceViewInput) {
  const selectedDataroom = useMemo(
    () =>
      datarooms.find((dataroom) => dataroom.id === selectedDataroomId) ?? null,
    [datarooms, selectedDataroomId],
  );

  const folderPath = useMemo(
    () => (tree ? getFolderPath(tree.folders, currentFolderId) : []),
    [currentFolderId, tree],
  );

  const isSearching = Boolean(searchQuery.trim());
  const visibleItems = useMemo(() => {
    if (!tree) {
      return [];
    }

    if (isSearching && searchResult) {
      return getSearchItems(searchResult);
    }

    return getItemsForFolder(tree, currentFolderId);
  }, [currentFolderId, isSearching, searchResult, tree]);

  return {
    selectedDataroom,
    folderPath,
    isSearching,
    visibleItems,
    hasNoDatarooms: !isDataroomsLoading && datarooms.length === 0,
  };
}
