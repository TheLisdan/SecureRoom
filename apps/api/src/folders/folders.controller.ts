import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  createFolderRequestSchema,
  renameFolderRequestSchema,
} from "@secure-room/api-contract";
import type { AuthUser } from "@secure-room/api-contract";

import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { UuidValidationPipe } from "../common/uuid-validation.pipe.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { FoldersService } from "./folders.service.js";

@Controller("folders")
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createFolderRequestSchema))
    body: { dataroomId: string; parentFolderId?: string | null; name: string },
  ) {
    return { folder: await this.foldersService.create(user, body) };
  }

  @Patch(":id")
  async rename(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("folderId")) id: string,
    @Body(new ZodValidationPipe(renameFolderRequestSchema))
    body: { name: string },
  ) {
    return { folder: await this.foldersService.rename(user, id, body.name) };
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("folderId")) id: string,
  ) {
    await this.foldersService.delete(user, id);
    return { ok: true };
  }
}
