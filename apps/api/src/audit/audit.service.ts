import { Injectable } from "@nestjs/common";
import type { AuditAction } from "@secure-room/api-contract";

import { PrismaService } from "../prisma/prisma.service.js";

type AuditInput = {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  dataroomId?: string | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        dataroomId: input.dataroomId ?? null,
      },
    });
  }
}
