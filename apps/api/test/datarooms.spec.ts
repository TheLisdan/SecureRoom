import { describe, expect, it, vi } from "vitest";

import type { AuditService } from "../src/audit/audit.service.js";
import type { PrismaService } from "../src/prisma/prisma.service.js";
import type { StorageService } from "../src/storage/storage.service.js";
import { DataroomsService } from "../src/datarooms/datarooms.service.js";

const owner = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "owner@example.com",
  name: "Owner",
};

const dataroom = {
  id: "00000000-0000-0000-0000-000000000002",
  ownerId: owner.id,
  name: "Acme Acquisition",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

describe("DataroomsService", () => {
  it("does not reveal dataroom existence across owners", async () => {
    const service = createService({
      dataroom: {
        findUnique: vi.fn().mockResolvedValue({
          ...dataroom,
          ownerId: "00000000-0000-0000-0000-000000000999",
        }),
      },
    });

    await expect(
      service.assertOwner(owner.id, dataroom.id),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Resource was not found.",
    });
  });

  it("rejects oversized search queries before hitting the search indexes", async () => {
    const folderFindMany = vi.fn();
    const fileFindMany = vi.fn();
    const service = createService({
      dataroom: {
        findUnique: vi.fn().mockResolvedValue(dataroom),
      },
      folder: { findMany: folderFindMany },
      fileAsset: { findMany: fileFindMany },
    });

    await expect(
      service.search(owner, dataroom.id, "x".repeat(121)),
    ).rejects.toMatchObject({
      code: "SEARCH_QUERY_TOO_LONG",
    });
    expect(folderFindMany).not.toHaveBeenCalled();
    expect(fileFindMany).not.toHaveBeenCalled();
  });

  it("searches folders by name and files by name or indexed content", async () => {
    const folder = {
      id: "00000000-0000-0000-0000-000000000003",
      dataroomId: dataroom.id,
      parentFolderId: null,
      name: "Financials",
      createdAt: dataroom.createdAt,
      updatedAt: dataroom.updatedAt,
    };
    const file = {
      id: "00000000-0000-0000-0000-000000000004",
      dataroomId: dataroom.id,
      folderId: folder.id,
      name: "Q1 Financials.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1000,
      searchText: "Revenue growth and diligence notes",
      createdAt: dataroom.createdAt,
      updatedAt: dataroom.updatedAt,
    };
    const folderFindMany = vi.fn().mockResolvedValue([folder]);
    const fileFindMany = vi.fn().mockResolvedValue([file]);
    const service = createService({
      dataroom: {
        findUnique: vi.fn().mockResolvedValue(dataroom),
      },
      folder: { findMany: folderFindMany },
      fileAsset: { findMany: fileFindMany },
    });

    await expect(
      service.search(owner, dataroom.id, "  fin  "),
    ).resolves.toEqual({
      folders: [
        {
          id: folder.id,
          dataroomId: folder.dataroomId,
          parentFolderId: null,
          name: "Financials",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
      ],
      files: [
        {
          id: file.id,
          dataroomId: file.dataroomId,
          folderId: file.folderId,
          name: file.name,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
      ],
    });
    expect(folderFindMany).toHaveBeenCalledWith({
      where: {
        dataroomId: dataroom.id,
        name: { contains: "fin", mode: "insensitive" },
      },
      orderBy: { name: "asc" },
      take: 20,
    });
    expect(fileFindMany).toHaveBeenCalledWith({
      where: {
        dataroomId: dataroom.id,
        OR: [
          { name: { contains: "fin", mode: "insensitive" } },
          { searchText: { contains: "fin", mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 20,
    });
  });

  it("rejects folders from another dataroom as move or upload destinations", async () => {
    const service = createService({
      folder: {
        findUnique: vi.fn().mockResolvedValue({
          id: "00000000-0000-0000-0000-000000000003",
          dataroomId: "00000000-0000-0000-0000-000000000999",
        }),
      },
    });

    await expect(
      service.assertFolderInDataroom(
        dataroom.id,
        "00000000-0000-0000-0000-000000000003",
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

function createService(models: {
  dataroom?: Record<string, unknown>;
  folder?: Record<string, unknown>;
  fileAsset?: Record<string, unknown>;
}) {
  return new DataroomsService(
    {
      dataroom: models.dataroom ?? {},
      folder: models.folder ?? {},
      fileAsset: models.fileAsset ?? {},
    } as unknown as PrismaService,
    {} as unknown as AuditService,
    {} as unknown as StorageService,
  );
}
