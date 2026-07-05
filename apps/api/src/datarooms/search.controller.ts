import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { AuthUser } from "@secure-room/api-contract";

import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUser } from "../common/current-user.decorator.js";
import { badRequest } from "../common/domain-error.js";
import { UuidValidationPipe } from "../common/uuid-validation.pipe.js";
import { DataroomsService } from "./datarooms.service.js";

@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly dataroomsService: DataroomsService) {}

  @Get()
  async search(
    @CurrentUser() user: AuthUser,
    @Query("dataroomId", new UuidValidationPipe("dataroomId"))
    dataroomId?: string,
    @Query("q") q?: string,
  ) {
    if (!dataroomId) {
      throw badRequest("MISSING_DATAROOM_ID", "dataroomId is required.");
    }

    return await this.dataroomsService.search(user, dataroomId, q ?? "");
  }
}
