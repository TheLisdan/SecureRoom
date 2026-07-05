import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "pnpm --dir ../.. --filter @secure-room/api-contract build && pnpm --dir ../.. --filter api prisma:generate && pnpm --dir ../.. --filter api dev",
      url: "http://localhost:3000/auth/me",
      reuseExistingServer: true,
    },
    {
      command:
        "pnpm --dir ../.. --filter @secure-room/api-contract build && pnpm --dir ../.. --filter client dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
    },
  ],
});
