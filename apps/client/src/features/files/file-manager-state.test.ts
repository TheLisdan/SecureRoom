import { describe, expect, it } from "vitest";
import type { DataroomTree } from "@secure-room/api-contract";

import {
  buildFolderDestinations,
  formatBytes,
  getFolderPath,
  getItemsForFolder,
  getSearchItems,
} from "./file-manager-state";

const tree: DataroomTree = {
  dataroom: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Acme Acquisition",
    ownerId: "00000000-0000-0000-0000-000000000002",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  folders: [
    {
      id: "00000000-0000-0000-0000-000000000003",
      dataroomId: "00000000-0000-0000-0000-000000000001",
      parentFolderId: null,
      name: "Legal",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      dataroomId: "00000000-0000-0000-0000-000000000001",
      parentFolderId: "00000000-0000-0000-0000-000000000003",
      name: "Contracts",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  files: [
    {
      id: "00000000-0000-0000-0000-000000000005",
      dataroomId: "00000000-0000-0000-0000-000000000001",
      folderId: null,
      name: "Disclosure.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
};

describe("file manager state helpers", () => {
  it("returns folders before files for the current folder", () => {
    expect(getItemsForFolder(tree, null).map((item) => item.name)).toEqual([
      "Legal",
      "Disclosure.pdf",
    ]);
  });

  it("builds breadcrumb folder path", () => {
    expect(
      getFolderPath(tree.folders, "00000000-0000-0000-0000-000000000004").map(
        (folder) => folder.name,
      ),
    ).toEqual(["Legal", "Contracts"]);
  });

  it("formats file sizes for readable table cells", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  it("maps search results into file-manager items", () => {
    expect(
      getSearchItems({
        folders: tree.folders.slice(0, 1),
        files: tree.files,
      }).map((item) => `${item.type}:${item.name}`),
    ).toEqual(["folder:Legal", "file:Disclosure.pdf"]);
  });

  it("builds sorted move destinations from nested folders", () => {
    expect(buildFolderDestinations(tree.folders)).toEqual([
      { folderId: null, name: "Home", depth: 0, path: "Home" },
      {
        folderId: "00000000-0000-0000-0000-000000000003",
        name: "Legal",
        depth: 1,
        path: "Home / Legal",
      },
      {
        folderId: "00000000-0000-0000-0000-000000000004",
        name: "Contracts",
        depth: 2,
        path: "Home / Legal / Contracts",
      },
    ]);
  });
});
