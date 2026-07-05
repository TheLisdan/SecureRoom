import { describe, expect, it, vi } from "vitest";

import type { AuditService } from "../audit/audit.service.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import type { StorageService } from "../storage/storage.service.js";
import { DataroomsService } from "./datarooms.service.js";

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "jane@example.com",
  name: "Jane Davis",
};

const dataroom = {
  id: "00000000-0000-0000-0000-000000000002",
  ownerId: user.id,
  name: "Acme",
  normalizedName: "acme",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

describe("DataroomsService", () => {
  it("records deletion before deleting the dataroom and removes private storage objects", async () => {
    const auditOperation = { operation: "audit" };
    const deleteOperation = { operation: "delete" };
    const transaction = vi.fn().mockResolvedValue([]);
    const storageDelete = vi.fn().mockResolvedValue(undefined);
    const service = new DataroomsService(
      {
        dataroom: {
          findUnique: vi.fn().mockResolvedValue(dataroom),
          delete: vi.fn().mockReturnValue(deleteOperation),
        },
        fileAsset: {
          findMany: vi
            .fn()
            .mockResolvedValue([
              { storageKey: "00000000-0000-0000-0000-000000000003.pdf" },
            ]),
        },
        auditLog: {
          create: vi.fn().mockReturnValue(auditOperation),
        },
        $transaction: transaction,
      } as unknown as PrismaService,
      {} as unknown as AuditService,
      { delete: storageDelete } as unknown as StorageService,
    );

    await service.delete(user, dataroom.id);

    expect(transaction).toHaveBeenCalledWith([auditOperation, deleteOperation]);
    expect(storageDelete).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000003.pdf",
    );
  });
});
