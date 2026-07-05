import { useCallback, useEffect, useState } from "react";

import type { FileManagerMutations } from "./queries";

export type UploadState = {
  fileName: string;
  progress: number;
};

type UseFileUploadControllerInput = {
  selectedDataroomId: string | null;
  currentFolderId: string | null;
  fileMutations: FileManagerMutations;
};

export function useFileUploadController({
  selectedDataroomId,
  currentFolderId,
  fileMutations,
}: UseFileUploadControllerInput) {
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  useEffect(() => {
    setUploadNotice(null);
  }, [selectedDataroomId]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!selectedDataroomId) {
        return;
      }

      setUploadNotice(null);

      if (files.length === 0) {
        setUploadNotice("Drop files here, not folders.");
        return;
      }

      try {
        for (const file of files) {
          setUploadState({ fileName: file.name, progress: 0 });
          await fileMutations.uploadFile.mutateAsync({
            dataroomId: selectedDataroomId,
            folderId: currentFolderId,
            file,
            onProgress: (progress) =>
              setUploadState({ fileName: file.name, progress }),
          });
        }
      } catch {
        // The mutation owns the surfaced API error; keep the UI state tidy here.
      } finally {
        setUploadState(null);
      }
    },
    [currentFolderId, fileMutations.uploadFile, selectedDataroomId],
  );

  return {
    uploadFiles,
    uploadState,
    uploadNotice,
    uploadError: fileMutations.uploadFile.error,
  };
}
