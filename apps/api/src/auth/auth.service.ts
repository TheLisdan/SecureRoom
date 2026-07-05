import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "@secure-room/api-contract";

import { AuditService } from "../audit/audit.service.js";
import { conflict, notFound, unauthorized } from "../common/domain-error.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { PasswordService } from "./password.service.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
  ) {}

  async register(
    input: RegisterRequest,
  ): Promise<{ user: AuthUser; token: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw conflict("An account with this email already exists.");
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
      },
    });

    return this.createSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }

  async login(input: LoginRequest): Promise<{ user: AuthUser; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw unauthorized("Email or password is incorrect.");
    }

    const isValidPassword = await this.passwordService.verify(
      user.passwordHash,
      input.password,
    );

    if (!isValidPassword) {
      throw unauthorized("Email or password is incorrect.");
    }

    const authUser = { id: user.id, email: user.email, name: user.name };
    await this.auditService.record({
      userId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
    });

    return this.createSession(authUser);
  }

  async getUserForSession(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw notFound("The session user no longer exists.");
    }

    return user;
  }

  private createSession(user: AuthUser): { user: AuthUser; token: string } {
    const token = this.jwtService.sign({ sub: user.id });
    return { user, token };
  }
}
