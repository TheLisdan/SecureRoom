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
  it("stores searchable text when uploading text-like files", async () => {
    const create = vi.fn().mockResolvedValue({
      ...file,
      name: "notes.txt",
      normalizedName: "notes.txt",
      mimeType: "text/plain",
      sizeBytes: 33,
      storageKey: "00000000-0000-0000-0000-000000000004.txt",
      searchText: "Revenue notes ARR grew by 18%.",
    });
    const service = new FilesService(
      {
        fileAsset: {
          findMany: vi.fn().mockResolvedValue([]),
          create,
        },
      } as unknown as PrismaService,
      {
        assertOwner: vi.fn().mockResolvedValue({ id: file.dataroomId }),
        assertFolderInDataroom: vi.fn().mockResolvedValue(undefined),
      } as unknown as DataroomsService,
      {
        record: vi.fn().mockResolvedValue(undefined),
      } as unknown as AuditService,
      {
        savePrivateFile: vi
          .fn()
          .mockResolvedValue("00000000-0000-0000-0000-000000000004.txt"),
        delete: vi.fn().mockResolvedValue(undefined),
      } as unknown as StorageService,
    );

    await service.upload(user, {
      dataroomId: file.dataroomId,
      folderId: null,
      originalName: "notes.txt",
      mimeType: "text/plain",
      sizeBytes: 33,
      buffer: Buffer.from("Revenue notes\nARR grew by 18%.", "utf8"),
      maxUploadBytes: 1024,
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "notes.txt",
        mimeType: "text/plain",
        searchText: "Revenue notes ARR grew by 18%.",
      }),
    });
  });

  it("renames duplicate uploads in the same folder with a copy suffix", async () => {
    const create = vi.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        ...file,
        ...data,
        id: "00000000-0000-0000-0000-000000000006",
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      }),
    );
    const service = new FilesService(
      {
        fileAsset: {
          findMany: vi
            .fn()
            .mockResolvedValue([
              { name: "Disclosure.pdf" },
              { name: "Disclosure (1).pdf" },
            ]),
          create,
        },
      } as unknown as PrismaService,
      {
        assertOwner: vi.fn().mockResolvedValue({ id: file.dataroomId }),
        assertFolderInDataroom: vi.fn().mockResolvedValue(undefined),
      } as unknown as DataroomsService,
      {
        record: vi.fn().mockResolvedValue(undefined),
      } as unknown as AuditService,
      {
        savePrivateFile: vi
          .fn()
          .mockResolvedValue("00000000-0000-0000-0000-000000000006.pdf"),
        delete: vi.fn().mockResolvedValue(undefined),
      } as unknown as StorageService,
    );

    await expect(
      service.upload(user, {
        dataroomId: file.dataroomId,
        folderId: null,
        originalName: "Disclosure.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        buffer: Buffer.from("%PDF-1.4"),
        maxUploadBytes: 4096,
      }),
    ).resolves.toMatchObject({
      name: "Disclosure (2).pdf",
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Disclosure (2).pdf",
        normalizedName: "disclosure (2).pdf",
      }),
    });
  });

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
