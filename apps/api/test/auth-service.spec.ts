import type { JwtService } from "@nestjs/jwt";
import { describe, expect, it, vi } from "vitest";

import type { AuditService } from "../src/audit/audit.service.js";
import type { PrismaService } from "../src/prisma/prisma.service.js";
import type { PasswordService } from "../src/auth/password.service.js";
import { AuthService } from "../src/auth/auth.service.js";

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "owner@example.com",
  name: "Owner",
  passwordHash: "hashed-password",
};

describe("AuthService", () => {
  it("registers a new user with a hashed password and a signed session token", async () => {
    const hash = vi.fn().mockResolvedValue("argon-hash");
    const sign = vi.fn().mockReturnValue("jwt-token");
    const create = vi
      .fn()
      .mockResolvedValue({ ...user, passwordHash: "argon-hash" });
    const service = createAuthService({
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create,
      },
      password: { hash, verify: vi.fn() },
      jwt: { sign },
      auditRecord: vi.fn(),
    });

    await expect(
      service.register({
        email: user.email,
        name: user.name,
        password: "correct horse battery staple",
      }),
    ).resolves.toEqual({
      user: { id: user.id, email: user.email, name: user.name },
      token: "jwt-token",
    });

    expect(hash).toHaveBeenCalledWith("correct horse battery staple");
    expect(create).toHaveBeenCalledWith({
      data: {
        email: user.email,
        name: user.name,
        passwordHash: "argon-hash",
      },
    });
    expect(sign).toHaveBeenCalledWith({ sub: user.id });
  });

  it("rejects duplicate registration emails", async () => {
    const service = createAuthService({
      user: {
        findUnique: vi.fn().mockResolvedValue(user),
        create: vi.fn(),
      },
      password: { hash: vi.fn(), verify: vi.fn() },
      jwt: { sign: vi.fn() },
      auditRecord: vi.fn(),
    });

    await expect(
      service.register({
        email: user.email,
        name: user.name,
        password: "correct horse battery staple",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("records login audit only after a valid password", async () => {
    const verify = vi.fn().mockResolvedValue(true);
    const record = vi.fn().mockResolvedValue(undefined);
    const sign = vi.fn().mockReturnValue("jwt-token");
    const service = createAuthService({
      user: {
        findUnique: vi.fn().mockResolvedValue(user),
        create: vi.fn(),
      },
      password: { hash: vi.fn(), verify },
      jwt: { sign },
      auditRecord: record,
    });

    await expect(
      service.login({ email: user.email, password: "valid-password" }),
    ).resolves.toMatchObject({
      user: { id: user.id, email: user.email, name: user.name },
      token: "jwt-token",
    });

    expect(verify).toHaveBeenCalledWith(user.passwordHash, "valid-password");
    expect(record).toHaveBeenCalledWith({
      userId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
    });
  });

  it("rejects invalid login credentials without creating a session", async () => {
    const sign = vi.fn();
    const service = createAuthService({
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      password: { hash: vi.fn(), verify: vi.fn() },
      jwt: { sign },
      auditRecord: vi.fn(),
    });

    await expect(
      service.login({ email: user.email, password: "bad-password" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(sign).not.toHaveBeenCalled();
  });
});

function createAuthService({
  user: userModel,
  password,
  jwt,
  auditRecord,
}: {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  password: Pick<PasswordService, "hash" | "verify">;
  jwt: Pick<JwtService, "sign">;
  auditRecord: ReturnType<typeof vi.fn>;
}) {
  return new AuthService(
    { user: userModel } as unknown as PrismaService,
    jwt as JwtService,
    password as PasswordService,
    { record: auditRecord } as unknown as AuditService,
  );
}
