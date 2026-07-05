import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@secure-room/api-contract";

import { AuditService } from "../audit/audit.service.js";
import { conflict, forbidden, notFound } from "../common/domain-error.js";
import { throwConflictOnUniqueConstraint } from "../common/prisma-errors.js";
import { normalizeSiblingName } from "../common/sibling-key.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "../storage/storage.service.js";
import { mapDataroom, mapFile, mapFolder } from "./mappers.js";

@Injectable()
export class DataroomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async list(user: AuthUser) {
    const datarooms = await this.prisma.dataroom.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return datarooms.map(mapDataroom);
  }

  async create(user: AuthUser, name: string) {
    const dataroom = await this.prisma.dataroom
      .create({
        data: {
          name,
          normalizedName: normalizeSiblingName(name),
          ownerId: user.id,
        },
      })
      .catch((error: unknown) =>
        throwConflictOnUniqueConstraint(
          error,
          "A dataroom with this name already exists.",
        ),
      );

    await this.auditService.record({
      userId: user.id,
      action: "DATAROOM_CREATE",
      entityType: "Dataroom",
      entityId: dataroom.id,
      dataroomId: dataroom.id,
    });

    return mapDataroom(dataroom);
  }

  async rename(user: AuthUser, dataroomId: string, name: string) {
    await this.assertOwner(user.id, dataroomId);

    const dataroom = await this.prisma.dataroom
      .update({
        where: { id: dataroomId },
        data: { name, normalizedName: normalizeSiblingName(name) },
      })
      .catch((error: unknown) =>
        throwConflictOnUniqueConstraint(
          error,
          "A dataroom with this name already exists.",
        ),
      );

    await this.auditService.record({
      userId: user.id,
      action: "DATAROOM_RENAME",
      entityType: "Dataroom",
      entityId: dataroomId,
      dataroomId,
    });

    return mapDataroom(dataroom);
  }

  async delete(user: AuthUser, dataroomId: string): Promise<void> {
    await this.assertOwner(user.id, dataroomId);

    const files = await this.prisma.fileAsset.findMany({
      where: { dataroomId },
      select: { storageKey: true },
    });

    await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "DATAROOM_DELETE",
          entityType: "Dataroom",
          entityId: dataroomId,
          dataroomId,
        },
      }),
      this.prisma.dataroom.delete({ where: { id: dataroomId } }),
    ]);

    await Promise.all(
      files.map((file) => this.storageService.delete(file.storageKey)),
    );
  }

  async tree(user: AuthUser, dataroomId: string) {
    const dataroom = await this.assertOwner(user.id, dataroomId);

    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { dataroomId },
        orderBy: [{ name: "asc" }],
      }),
      this.prisma.fileAsset.findMany({
        where: { dataroomId },
        orderBy: [{ name: "asc" }],
      }),
    ]);

    return {
      dataroom: mapDataroom(dataroom),
      folders: folders.map(mapFolder),
      files: files.map(mapFile),
    };
  }

  async search(user: AuthUser, dataroomId: string, query: string) {
    await this.assertOwner(user.id, dataroomId);
    const normalizedQuery = query.trim();

    if (normalizedQuery.length === 0) {
      return { folders: [], files: [] };
    }

    const [folders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: {
          dataroomId,
          name: { contains: normalizedQuery, mode: "insensitive" },
        },
        orderBy: { name: "asc" },
        take: 20,
      }),
      this.prisma.fileAsset.findMany({
        where: {
          dataroomId,
          name: { contains: normalizedQuery, mode: "insensitive" },
        },
        orderBy: { name: "asc" },
        take: 20,
      }),
    ]);

    return {
      folders: folders.map(mapFolder),
      files: files.map(mapFile),
    };
  }

  async assertOwner(userId: string, dataroomId: string) {
    const dataroom = await this.prisma.dataroom.findUnique({
      where: { id: dataroomId },
    });

    if (!dataroom) {
      throw notFound("Dataroom was not found.");
    }

    if (dataroom.ownerId !== userId) {
      throw forbidden();
    }

    return dataroom;
  }

  async assertFolderInDataroom(
    dataroomId: string,
    folderId: string | null | undefined,
  ): Promise<void> {
    if (!folderId) {
      return;
    }

    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.dataroomId !== dataroomId) {
      throw conflict("The target folder does not belong to this dataroom.");
    }
  }
}
