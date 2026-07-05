import { Injectable } from "@nestjs/common";
import type { ReadStream } from "node:fs";
import type { FileAsset } from "@prisma/client";
import type { AuthUser } from "@secure-room/api-contract";

import { AuditService } from "../audit/audit.service.js";
import { conflict, notFound } from "../common/domain-error.js";
import { throwConflictOnUniqueConstraint } from "../common/prisma-errors.js";
import { locationKey, normalizeSiblingName } from "../common/sibling-key.js";
import { DataroomsService } from "../datarooms/datarooms.service.js";
import { mapFile } from "../datarooms/mappers.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "../storage/storage.service.js";
import { validateFileUpload } from "./file-upload-validation.js";
import { getPreviewContentType } from "./preview-types.js";

type UploadInput = {
  dataroomId: string;
  folderId?: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
  maxUploadBytes: number;
};

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataroomsService: DataroomsService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async upload(user: AuthUser, input: UploadInput) {
    const validatedFile = validateFileUpload(
      {
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      },
      input.maxUploadBytes,
    );

    await this.dataroomsService.assertOwner(user.id, input.dataroomId);
    await this.dataroomsService.assertFolderInDataroom(
      input.dataroomId,
      input.folderId,
    );
    await this.assertFileNameAvailable(
      input.dataroomId,
      input.folderId ?? null,
      validatedFile.name,
    );

    const storageKey = await this.storageService.savePrivateFile(
      input.buffer,
      validatedFile.storageExtension,
    );

    try {
      const file = await this.prisma.fileAsset
        .create({
          data: {
            dataroomId: input.dataroomId,
            folderId: input.folderId ?? null,
            folderKey: locationKey(input.folderId),
            name: validatedFile.name,
            normalizedName: normalizeSiblingName(validatedFile.name),
            mimeType: validatedFile.mimeType,
            sizeBytes: input.sizeBytes,
            storageKey,
          },
        })
        .catch((error: unknown) =>
          throwConflictOnUniqueConstraint(
            error,
            "A file with this name already exists here.",
          ),
        );

      await this.auditService.record({
        userId: user.id,
        action: "FILE_UPLOAD",
        entityType: "FileAsset",
        entityId: file.id,
        dataroomId: file.dataroomId,
      });

      return mapFile(file);
    } catch (error) {
      await this.storageService.delete(storageKey);
      throw error;
    }
  }

  async rename(user: AuthUser, fileId: string, name: string) {
    const file = await this.getFileOrThrow(fileId);
    await this.dataroomsService.assertOwner(user.id, file.dataroomId);
    await this.assertFileNameAvailable(
      file.dataroomId,
      file.folderId,
      name,
      file.id,
    );

    const updatedFile = await this.prisma.fileAsset
      .update({
        where: { id: fileId },
        data: { name, normalizedName: normalizeSiblingName(name) },
      })
      .catch((error: unknown) =>
        throwConflictOnUniqueConstraint(
          error,
          "A file with this name already exists here.",
        ),
      );

    await this.auditService.record({
      userId: user.id,
      action: "FILE_RENAME",
      entityType: "FileAsset",
      entityId: fileId,
      dataroomId: file.dataroomId,
    });

    return mapFile(updatedFile);
  }

  async move(user: AuthUser, fileId: string, folderId: string | null) {
    const file = await this.getFileOrThrow(fileId);
    await this.dataroomsService.assertOwner(user.id, file.dataroomId);
    await this.dataroomsService.assertFolderInDataroom(
      file.dataroomId,
      folderId,
    );

    if (file.folderId === folderId) {
      return mapFile(file);
    }

    await this.assertFileNameAvailable(
      file.dataroomId,
      folderId,
      file.name,
      file.id,
    );

    const movedFile = await this.prisma.fileAsset
      .update({
        where: { id: fileId },
        data: { folderId, folderKey: locationKey(folderId) },
      })
      .catch((error: unknown) =>
        throwConflictOnUniqueConstraint(
          error,
          "A file with this name already exists here.",
        ),
      );

    await this.auditService.record({
      userId: user.id,
      action: "FILE_MOVE",
      entityType: "FileAsset",
      entityId: fileId,
      dataroomId: file.dataroomId,
    });

    return mapFile(movedFile);
  }

  async delete(user: AuthUser, fileId: string): Promise<void> {
    const file = await this.getFileOrThrow(fileId);
    await this.dataroomsService.assertOwner(user.id, file.dataroomId);

    await this.prisma.$transaction([
      this.prisma.fileAsset.delete({ where: { id: fileId } }),
      this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "FILE_DELETE",
          entityType: "FileAsset",
          entityId: fileId,
          dataroomId: file.dataroomId,
        },
      }),
    ]);

    await this.storageService.delete(file.storageKey);
  }

  async openForPreview(
    user: AuthUser,
    fileId: string,
  ): Promise<{ contentType: string; file: FileAsset; stream: ReadStream }> {
    const file = await this.getFileOrThrow(fileId);
    await this.dataroomsService.assertOwner(user.id, file.dataroomId);
    const contentType = getPreviewContentType(file.mimeType, file.name);

    await this.auditService.record({
      userId: user.id,
      action: "FILE_PREVIEW",
      entityType: "FileAsset",
      entityId: file.id,
      dataroomId: file.dataroomId,
    });

    return {
      contentType,
      file,
      stream: this.storageService.openReadStream(file.storageKey),
    };
  }

  async openForDownload(
    user: AuthUser,
    fileId: string,
  ): Promise<{ file: FileAsset; stream: ReadStream }> {
    const file = await this.getFileOrThrow(fileId);
    await this.dataroomsService.assertOwner(user.id, file.dataroomId);

    await this.auditService.record({
      userId: user.id,
      action: "FILE_DOWNLOAD",
      entityType: "FileAsset",
      entityId: file.id,
      dataroomId: file.dataroomId,
    });

    return {
      file,
      stream: this.storageService.openReadStream(file.storageKey),
    };
  }

  private async getFileOrThrow(fileId: string) {
    const file = await this.prisma.fileAsset.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw notFound("File was not found.");
    }

    return file;
  }

  private async assertFileNameAvailable(
    dataroomId: string,
    folderId: string | null,
    name: string,
    currentFileId?: string,
  ): Promise<void> {
    const existing = await this.prisma.fileAsset.findFirst({
      where: {
        dataroomId,
        folderKey: locationKey(folderId),
        normalizedName: normalizeSiblingName(name),
        ...(currentFileId ? { id: { not: currentFileId } } : {}),
      },
    });

    if (existing) {
      throw conflict("A file with this name already exists here.");
    }
  }
}
