import { describe, expect, it, vi } from "vitest";

import type { AuditService } from "../src/audit/audit.service.js";
import {
  locationKey,
  normalizeSiblingName,
} from "../src/common/sibling-key.js";
import type { DataroomsService } from "../src/datarooms/datarooms.service.js";
import type { PrismaService } from "../src/prisma/prisma.service.js";
import type { StorageService } from "../src/storage/storage.service.js";
import { FoldersService } from "../src/folders/folders.service.js";

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "owner@example.com",
  name: "Owner",
};

const dataroomId = "00000000-0000-0000-0000-000000000002";
const parentFolderId = "00000000-0000-0000-0000-000000000003";
const folder = {
  id: "00000000-0000-0000-0000-000000000004",
  dataroomId,
  parentFolderId,
  parentFolderKey: locationKey(parentFolderId),
  name: "Contracts",
  normalizedName: "contracts",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-02T00:00:00.000Z"),
};

describe("FoldersService", () => {
  it("creates folders with normalized sibling integrity fields and audit", async () => {
    const create = vi.fn().mockResolvedValue(folder);
    const record = vi.fn().mockResolvedValue(undefined);
    const service = createService({
      folder: {
        findFirst: vi.fn().mockResolvedValue(null),
        create,
      },
      auditRecord: record,
    });

    await expect(
      service.create(user, {
        dataroomId,
        parentFolderId,
        name: "Contracts",
      }),
    ).resolves.toMatchObject({
      id: folder.id,
      parentFolderId,
      name: "Contracts",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        dataroomId,
        parentFolderId,
        parentFolderKey: locationKey(parentFolderId),
        name: "Contracts",
        normalizedName: normalizeSiblingName("Contracts"),
      },
    });
    expect(record).toHaveBeenCalledWith({
      userId: user.id,
      action: "FOLDER_CREATE",
      entityType: "Folder",
      entityId: folder.id,
      dataroomId,
    });
  });

  it("deletes nested folder storage objects after the database transaction", async () => {
    const deleteOperation = { operation: "delete-folder" };
    const auditOperation = { operation: "audit-delete" };
    const transaction = vi.fn().mockResolvedValue([]);
    const storageDelete = vi.fn().mockResolvedValue(undefined);
    const fileFindMany = vi
      .fn()
      .mockResolvedValue([
        { storageKey: "00000000-0000-0000-0000-000000000006.pdf" },
        { storageKey: "00000000-0000-0000-0000-000000000007.txt" },
      ]);
    const service = createService({
      folder: {
        findUnique: vi.fn().mockResolvedValue(folder),
        findMany: vi.fn().mockResolvedValue([
          { id: folder.id, parentFolderId },
          {
            id: "00000000-0000-0000-0000-000000000005",
            parentFolderId: folder.id,
          },
        ]),
        delete: vi.fn().mockReturnValue(deleteOperation),
      },
      fileAsset: {
        findMany: fileFindMany,
      },
      auditLog: {
        create: vi.fn().mockReturnValue(auditOperation),
      },
      transaction,
      storageDelete,
    });

    await service.delete(user, folder.id);

    expect(fileFindMany).toHaveBeenCalledWith({
      where: {
        folderId: {
          in: [folder.id, "00000000-0000-0000-0000-000000000005"],
        },
      },
      select: { storageKey: true },
    });
    expect(transaction).toHaveBeenCalledWith([deleteOperation, auditOperation]);
    expect(storageDelete).toHaveBeenCalledTimes(2);
    expect(storageDelete).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000006.pdf",
    );
    expect(storageDelete).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000007.txt",
    );
  });
});

function createService({
  folder: folderModel,
  fileAsset,
  auditLog,
  transaction,
  auditRecord,
  storageDelete,
}: {
  folder: Record<string, unknown>;
  fileAsset?: Record<string, unknown>;
  auditLog?: Record<string, unknown>;
  transaction?: ReturnType<typeof vi.fn>;
  auditRecord?: ReturnType<typeof vi.fn>;
  storageDelete?: ReturnType<typeof vi.fn>;
}) {
  return new FoldersService(
    {
      folder: folderModel,
      fileAsset: fileAsset ?? {},
      auditLog: auditLog ?? {},
      $transaction: transaction ?? vi.fn(),
    } as unknown as PrismaService,
    {
      assertOwner: vi.fn().mockResolvedValue({ id: dataroomId }),
      assertFolderInDataroom: vi.fn().mockResolvedValue(undefined),
    } as unknown as DataroomsService,
    { record: auditRecord ?? vi.fn() } as unknown as AuditService,
    { delete: storageDelete ?? vi.fn() } as unknown as StorageService,
  );
}
