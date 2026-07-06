import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@secure-room/api-contract";

import { AuditService } from "../audit/audit.service.js";
import { conflict, notFound } from "../common/domain-error.js";
import { throwConflictOnUniqueConstraint } from "../common/prisma-errors.js";
import { locationKey, normalizeSiblingName } from "../common/sibling-key.js";
import { DataroomsService } from "../datarooms/datarooms.service.js";
import { mapFolder } from "../datarooms/mappers.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "../storage/storage.service.js";
import { collectDescendantFolderIds } from "./folder-tree.js";

@Injectable()
export class FoldersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataroomsService: DataroomsService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    user: AuthUser,
    input: { dataroomId: string; parentFolderId?: string | null; name: string },
  ) {
    await this.dataroomsService.assertOwner(user.id, input.dataroomId);
    await this.dataroomsService.assertFolderInDataroom(
      input.dataroomId,
      input.parentFolderId,
    );
    await this.assertFolderNameAvailable(
      input.dataroomId,
      input.parentFolderId ?? null,
      input.name,
    );

    const folder = await this.prisma.folder
      .create({
        data: {
          dataroomId: input.dataroomId,
          parentFolderId: input.parentFolderId ?? null,
          parentFolderKey: locationKey(input.parentFolderId),
          name: input.name,
          normalizedName: normalizeSiblingName(input.name),
        },
      })
      .catch((error: unknown) =>
        throwConflictOnUniqueConstraint(
          error,
          "A folder with this name already exists here.",
        ),
      );

    await this.auditService.record({
      userId: user.id,
      action: "FOLDER_CREATE",
      entityType: "Folder",
      entityId: folder.id,
      dataroomId: folder.dataroomId,
    });

    return mapFolder(folder);
  }

  async rename(user: AuthUser, folderId: string, name: string) {
    const folder = await this.getFolderOrThrow(folderId);
    await this.dataroomsService.assertOwner(user.id, folder.dataroomId);
    await this.assertFolderNameAvailable(
      folder.dataroomId,
      folder.parentFolderId,
      name,
      folder.id,
    );

    const updatedFolder = await this.prisma.folder
      .update({
        where: { id: folderId },
        data: { name, normalizedName: normalizeSiblingName(name) },
      })
      .catch((error: unknown) =>
        throwConflictOnUniqueConstraint(
          error,
          "A folder with this name already exists here.",
        ),
      );

    await this.auditService.record({
      userId: user.id,
      action: "FOLDER_RENAME",
      entityType: "Folder",
      entityId: folderId,
      dataroomId: folder.dataroomId,
    });

    return mapFolder(updatedFolder);
  }

  async delete(user: AuthUser, folderId: string): Promise<void> {
    const folder = await this.getFolderOrThrow(folderId);
    await this.dataroomsService.assertOwner(user.id, folder.dataroomId);

    const folders = await this.prisma.folder.findMany({
      where: { dataroomId: folder.dataroomId },
      select: { id: true, parentFolderId: true },
    });
    const folderIds = collectDescendantFolderIds(folders, folderId);
    const nestedFiles = await this.prisma.fileAsset.findMany({
      where: { folderId: { in: folderIds } },
      select: { storageKey: true },
    });

    await this.prisma.$transaction([
      this.prisma.folder.delete({ where: { id: folderId } }),
      this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "FOLDER_DELETE",
          entityType: "Folder",
          entityId: folderId,
          dataroomId: folder.dataroomId,
        },
      }),
    ]);

    await Promise.all(
      nestedFiles.map((file) => this.storageService.delete(file.storageKey)),
    );
  }

  private async getFolderOrThrow(folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw notFound();
    }

    return folder;
  }

  private async assertFolderNameAvailable(
    dataroomId: string,
    parentFolderId: string | null,
    name: string,
    currentFolderId?: string,
  ): Promise<void> {
    const existing = await this.prisma.folder.findFirst({
      where: {
        dataroomId,
        parentFolderKey: locationKey(parentFolderId),
        normalizedName: normalizeSiblingName(name),
        ...(currentFolderId ? { id: { not: currentFolderId } } : {}),
      },
    });

    if (existing) {
      throw conflict("A folder with this name already exists here.");
    }
  }
}
