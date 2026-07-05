import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Get,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Response } from "express";
import {
  moveFileRequestSchema,
  renameFileRequestSchema,
} from "@secure-room/api-contract";
import type { AuthUser } from "@secure-room/api-contract";

import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { badRequest } from "../common/domain-error.js";
import { UuidValidationPipe } from "../common/uuid-validation.pipe.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { loadEnv } from "../config/env.js";
import { contentDispositionAttachment } from "./content-disposition.js";
import { FilesService } from "./files.service.js";
import { decodeMultipartFilename } from "./multipart-filename.js";

const maxUploadBytes = loadEnv().MAX_UPLOAD_MB * 1024 * 1024;

@Controller("files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: maxUploadBytes },
    }),
  )
  async upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("dataroomId", new UuidValidationPipe("dataroomId"))
    dataroomId?: string,
    @Body("folderId") folderId?: string,
  ) {
    if (!file) {
      throw badRequest("MISSING_FILE", "A file is required.");
    }

    if (!dataroomId) {
      throw badRequest("MISSING_DATAROOM_ID", "dataroomId is required.");
    }

    const parsedFolderId = folderId
      ? new UuidValidationPipe("folderId").transform(folderId)
      : null;

    return {
      file: await this.filesService.upload(user, {
        dataroomId,
        folderId: parsedFolderId,
        originalName: decodeMultipartFilename(file.originalname),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        buffer: file.buffer,
        maxUploadBytes,
      }),
    };
  }

  @Patch(":id")
  async rename(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("fileId")) id: string,
    @Body(new ZodValidationPipe(renameFileRequestSchema))
    body: { name: string },
  ) {
    return { file: await this.filesService.rename(user, id, body.name) };
  }

  @Patch(":id/move")
  async move(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("fileId")) id: string,
    @Body(new ZodValidationPipe(moveFileRequestSchema))
    body: { folderId: string | null },
  ) {
    return { file: await this.filesService.move(user, id, body.folderId) };
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("fileId")) id: string,
  ) {
    await this.filesService.delete(user, id);
    return { ok: true };
  }

  @Get(":id/preview")
  async preview(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("fileId")) id: string,
    @Res() response: Response,
  ) {
    const { contentType, file, stream } =
      await this.filesService.openForPreview(user, id);

    response.setHeader("Content-Type", contentType);
    response.setHeader("Content-Length", file.sizeBytes.toString());
    response.setHeader("Content-Security-Policy", "sandbox");
    response.setHeader("X-Content-Type-Options", "nosniff");
    stream.pipe(response);
  }

  @Get(":id/download")
  async download(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("fileId")) id: string,
    @Res() response: Response,
  ) {
    const { file, stream } = await this.filesService.openForDownload(user, id);

    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("Content-Length", file.sizeBytes.toString());
    response.setHeader(
      "Content-Disposition",
      contentDispositionAttachment(file.name),
    );
    response.setHeader("X-Content-Type-Options", "nosniff");
    stream.pipe(response);
  }
}
