import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { StorageModule } from "../storage/storage.module.js";
import { DataroomsController } from "./datarooms.controller.js";
import { DataroomsService } from "./datarooms.service.js";
import { SearchController } from "./search.controller.js";

@Module({
  imports: [AuthModule, AuditModule, StorageModule],
  controllers: [DataroomsController, SearchController],
  providers: [DataroomsService],
  exports: [DataroomsService],
})
export class DataroomsModule {}
