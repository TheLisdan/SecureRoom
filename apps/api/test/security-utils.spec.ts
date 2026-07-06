import { describe, expect, it } from "vitest";

import { loadEnv } from "../src/config/env.js";
import { contentDispositionAttachment } from "../src/files/content-disposition.js";
import { PasswordService } from "../src/auth/password.service.js";

const baseEnv = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/secure_room",
  JWT_SECRET: "safe-development-secret",
  CLIENT_ORIGIN: "http://localhost:5173",
  COOKIE_DOMAIN: "",
  PORT: "3000",
  MAX_UPLOAD_MB: "20",
  STORAGE_DIR: "./private-storage",
};

describe("security utilities", () => {
  it("builds safe attachment headers for non-ASCII filenames", () => {
    expect(contentDispositionAttachment('договор "final".pdf')).toBe(
      `attachment; filename="_______ _final_.pdf"; filename*=UTF-8''%D0%B4%D0%BE%D0%B3%D0%BE%D0%B2%D0%BE%D1%80%20%22final%22.pdf`,
    );
  });

  it("rejects weak production JWT secrets", () => {
    withEnv(
      {
        ...baseEnv,
        NODE_ENV: "production",
        JWT_SECRET: "change-me-before-deploying",
      },
      () => {
        expect(() => loadEnv()).toThrow();
      },
    );
  });

  it("rejects short production JWT secrets", () => {
    withEnv(
      {
        ...baseEnv,
        NODE_ENV: "production",
        JWT_SECRET: "short-production-secret",
      },
      () => {
        expect(() => loadEnv()).toThrow();
      },
    );
  });

  it("parses local environment values into typed config", () => {
    withEnv(
      { ...baseEnv, NODE_ENV: "development", MAX_UPLOAD_MB: "25" },
      () => {
        expect(loadEnv()).toMatchObject({
          NODE_ENV: "development",
          MAX_UPLOAD_MB: 25,
          PORT: 3000,
        });
      },
    );
  });

  it("hashes passwords with a non-plain value and verifies them", async () => {
    const passwordService = new PasswordService();
    const hash = await passwordService.hash("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    await expect(
      passwordService.verify(hash, "correct horse battery staple"),
    ).resolves.toBe(true);
    await expect(passwordService.verify(hash, "wrong password")).resolves.toBe(
      false,
    );
  });
});

function withEnv(env: NodeJS.ProcessEnv, assertion: () => void) {
  const originalEnv = process.env;
  process.env = { ...env };

  try {
    assertion();
  } finally {
    process.env = originalEnv;
  }
}
