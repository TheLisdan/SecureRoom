import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  AuthUser,
  Dataroom,
  DataroomTree,
  SearchResult,
} from "@secure-room/api-contract";

import { DataroomWorkspace } from "./DataroomWorkspace";

const user: AuthUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "alice@example.com",
  name: "Alice Manager",
};

const emptyTree: DataroomTree = {
  dataroom: {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Acme Acquisition",
    ownerId: user.id,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  folders: [],
  files: [],
};

const treeWithFileAndFolder: DataroomTree = {
  ...emptyTree,
  folders: [
    {
      id: "00000000-0000-0000-0000-000000000003",
      dataroomId: emptyTree.dataroom.id,
      parentFolderId: null,
      name: "Legal",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  files: [
    {
      id: "00000000-0000-0000-0000-000000000004",
      dataroomId: emptyTree.dataroom.id,
      folderId: null,
      name: "Disclosure.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
};

const mocks = vi.hoisted(() => ({
  datarooms: { data: [] as Dataroom[], isLoading: false },
  tree: { data: undefined as DataroomTree | undefined, isLoading: false },
  search: { data: undefined as SearchResult | undefined, isFetching: false },
  authMutations: { logout: { mutate: vi.fn() } },
  dataroomMutations: {
    create: { mutate: vi.fn(), error: null },
    rename: { mutate: vi.fn(), error: null },
    delete: { mutate: vi.fn(), error: null, isPending: false },
  },
  fileMutations: {
    createFolder: { mutate: vi.fn(), error: null },
    renameFolder: { mutate: vi.fn(), error: null },
    deleteFolder: { mutate: vi.fn(), error: null },
    renameFile: { mutate: vi.fn(), error: null },
    moveFile: { mutate: vi.fn(), error: null, isPending: false },
    deleteFile: { mutate: vi.fn(), error: null },
    uploadFile: { mutateAsync: vi.fn(), error: null },
  },
}));

vi.mock("./queries", () => ({
  useDatarooms: () => mocks.datarooms,
  useDataroomTree: () => mocks.tree,
  useSearch: () => mocks.search,
  useDataroomMutations: () => mocks.dataroomMutations,
}));

vi.mock("../auth/queries", () => ({
  useAuthMutations: () => mocks.authMutations,
}));

vi.mock("../files/queries", () => ({
  useFileManagerMutations: () => mocks.fileMutations,
}));

describe("DataroomWorkspace", () => {
  it("shows a primary empty state when the user has no datarooms", () => {
    mocks.datarooms.data = [];
    mocks.tree.data = undefined;

    render(<DataroomWorkspace user={user} />);

    expect(
      screen.getByRole("heading", { name: /create your first dataroom/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /create dataroom/i }).length,
    ).toBeGreaterThan(0);
  });

  it("exposes dataroom actions for the selected room", () => {
    mocks.datarooms.data = [
      {
        id: emptyTree.dataroom.id,
        name: emptyTree.dataroom.name,
        ownerId: user.id,
        createdAt: emptyTree.dataroom.createdAt,
        updatedAt: emptyTree.dataroom.updatedAt,
      },
    ];
    mocks.tree.data = emptyTree;

    render(<DataroomWorkspace user={user} />);

    expect(
      screen.getByRole("button", { name: /open dataroom actions/i }),
    ).toBeInTheDocument();
  });

  it("opens file move destinations from the details panel", () => {
    mocks.datarooms.data = [
      {
        id: treeWithFileAndFolder.dataroom.id,
        name: treeWithFileAndFolder.dataroom.name,
        ownerId: user.id,
        createdAt: treeWithFileAndFolder.dataroom.createdAt,
        updatedAt: treeWithFileAndFolder.dataroom.updatedAt,
      },
    ];
    mocks.tree.data = treeWithFileAndFolder;

    render(<DataroomWorkspace user={user} />);

    fireEvent.click(screen.getByRole("button", { name: "Disclosure.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Move" }));

    expect(
      screen.getByRole("dialog", { name: "Move file" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /legal/i })).toBeInTheDocument();
  });
});
