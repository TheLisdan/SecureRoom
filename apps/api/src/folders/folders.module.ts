import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { DataroomsModule } from "../datarooms/datarooms.module.js";
import { StorageModule } from "../storage/storage.module.js";
import { FoldersController } from "./folders.controller.js";
import { FoldersService } from "./folders.service.js";

@Module({
  imports: [AuthModule, AuditModule, DataroomsModule, StorageModule],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
