import { describe, expect, it, vi } from "vitest";

import type { AuditService } from "../audit/audit.service.js";
import { locationKey } from "../common/sibling-key.js";
import type { DataroomsService } from "../datarooms/datarooms.service.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import type { StorageService } from "../storage/storage.service.js";
import { FilesService } from "./files.service.js";

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "jane@example.com",
  name: "Jane Davis",
};

const file = {
  id: "00000000-0000-0000-0000-000000000002",
  dataroomId: "00000000-0000-0000-0000-000000000003",
  folderId: null,
  folderKey: "root",
  name: "Disclosure.pdf",
  normalizedName: "disclosure.pdf",
  mimeType: "application/pdf",
  sizeBytes: 2048,
  storageKey: "00000000-0000-0000-0000-000000000004.pdf",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const targetFolderId = "00000000-0000-0000-0000-000000000005";

describe("FilesService", () => {
  it("moves a file into a target folder and records audit", async () => {
    const update = vi.fn().mockResolvedValue({
      ...file,
      folderId: targetFolderId,
      folderKey: locationKey(targetFolderId),
    });
    const record = vi.fn().mockResolvedValue(undefined);
    const assertFolderInDataroom = vi.fn().mockResolvedValue(undefined);
    const service = new FilesService(
      {
        fileAsset: {
          findUnique: vi.fn().mockResolvedValue(file),
          findFirst: vi.fn().mockResolvedValue(null),
          update,
        },
      } as unknown as PrismaService,
      {
        assertOwner: vi.fn().mockResolvedValue({ id: file.dataroomId }),
        assertFolderInDataroom,
      } as unknown as DataroomsService,
      { record } as unknown as AuditService,
      {} as unknown as StorageService,
    );

    await expect(
      service.move(user, file.id, targetFolderId),
    ).resolves.toMatchObject({
      id: file.id,
      folderId: targetFolderId,
    });

    expect(assertFolderInDataroom).toHaveBeenCalledWith(
      file.dataroomId,
      targetFolderId,
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: file.id },
      data: {
        folderId: targetFolderId,
        folderKey: locationKey(targetFolderId),
      },
    });
    expect(record).toHaveBeenCalledWith({
      userId: user.id,
      action: "FILE_MOVE",
      entityType: "FileAsset",
      entityId: file.id,
      dataroomId: file.dataroomId,
    });
  });

  it("rejects moves when the target already has a file with the same name", async () => {
    const service = new FilesService(
      {
        fileAsset: {
          findUnique: vi.fn().mockResolvedValue(file),
          findFirst: vi.fn().mockResolvedValue({ id: "existing-file" }),
          update: vi.fn(),
        },
      } as unknown as PrismaService,
      {
        assertOwner: vi.fn().mockResolvedValue({ id: file.dataroomId }),
        assertFolderInDataroom: vi.fn().mockResolvedValue(undefined),
      } as unknown as DataroomsService,
      { record: vi.fn() } as unknown as AuditService,
      {} as unknown as StorageService,
    );

    await expect(
      service.move(user, file.id, targetFolderId),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
