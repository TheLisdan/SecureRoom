import { describe, expect, it, vi } from "vitest";

import type { AuditService } from "../src/audit/audit.service.js";
import { locationKey } from "../src/common/sibling-key.js";
import type { DataroomsService } from "../src/datarooms/datarooms.service.js";
import type { PrismaService } from "../src/prisma/prisma.service.js";
import type { StorageService } from "../src/storage/storage.service.js";
import { FilesService } from "../src/files/files.service.js";

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "owner@example.com",
  name: "Owner",
};

const folderId = "00000000-0000-0000-0000-000000000002";
const file = {
  id: "00000000-0000-0000-0000-000000000003",
  dataroomId: "00000000-0000-0000-0000-000000000004",
  folderId,
  folderKey: locationKey(folderId),
  name: "Disclosure.pdf",
  normalizedName: "disclosure.pdf",
  mimeType: "application/pdf",
  sizeBytes: 4096,
  storageKey: "00000000-0000-0000-0000-000000000005.pdf",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("file move use case", () => {
  it("moves a file back to the dataroom root with the normalized root location key", async () => {
    const update = vi.fn().mockResolvedValue({
      ...file,
      folderId: null,
      folderKey: locationKey(null),
    });
    const record = vi.fn().mockResolvedValue(undefined);
    const service = createService({
      findUnique: vi.fn().mockResolvedValue(file),
      findFirst: vi.fn().mockResolvedValue(null),
      update,
      record,
    });

    await expect(service.move(user, file.id, null)).resolves.toMatchObject({
      id: file.id,
      folderId: null,
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: file.id },
      data: { folderId: null, folderKey: locationKey(null) },
    });
    expect(record).toHaveBeenCalledWith({
      userId: user.id,
      action: "FILE_MOVE",
      entityType: "FileAsset",
      entityId: file.id,
      dataroomId: file.dataroomId,
    });
  });

  it("does not update or audit when the file is already in the target folder", async () => {
    const findFirst = vi.fn();
    const update = vi.fn();
    const record = vi.fn();
    const service = createService({
      findUnique: vi.fn().mockResolvedValue(file),
      findFirst,
      update,
      record,
    });

    await expect(service.move(user, file.id, folderId)).resolves.toMatchObject({
      id: file.id,
      folderId,
    });

    expect(findFirst).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });
});

function createService({
  findUnique,
  findFirst,
  update,
  record,
}: {
  findUnique: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  record: ReturnType<typeof vi.fn>;
}) {
  return new FilesService(
    {
      fileAsset: {
        findUnique,
        findFirst,
        update,
      },
    } as unknown as PrismaService,
    {
      assertOwner: vi.fn().mockResolvedValue({ id: file.dataroomId }),
      assertFolderInDataroom: vi.fn().mockResolvedValue(undefined),
    } as unknown as DataroomsService,
    { record } as unknown as AuditService,
    {} as unknown as StorageService,
  );
}
