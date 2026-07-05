import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  createDataroomRequestSchema,
  renameDataroomRequestSchema,
} from "@secure-room/api-contract";
import type { AuthUser } from "@secure-room/api-contract";

import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { UuidValidationPipe } from "../common/uuid-validation.pipe.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { DataroomsService } from "./datarooms.service.js";

@Controller("datarooms")
@UseGuards(JwtAuthGuard)
export class DataroomsController {
  constructor(private readonly dataroomsService: DataroomsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return { datarooms: await this.dataroomsService.list(user) };
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createDataroomRequestSchema))
    body: { name: string },
  ) {
    return { dataroom: await this.dataroomsService.create(user, body.name) };
  }

  @Get(":id/tree")
  async tree(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("dataroomId")) id: string,
  ) {
    return await this.dataroomsService.tree(user, id);
  }

  @Patch(":id")
  async rename(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("dataroomId")) id: string,
    @Body(new ZodValidationPipe(renameDataroomRequestSchema))
    body: { name: string },
  ) {
    return {
      dataroom: await this.dataroomsService.rename(user, id, body.name),
    };
  }

  @Delete(":id")
  async delete(
    @CurrentUser() user: AuthUser,
    @Param("id", new UuidValidationPipe("dataroomId")) id: string,
  ) {
    await this.dataroomsService.delete(user, id);
    return { ok: true };
  }
}
