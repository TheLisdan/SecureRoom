import "dotenv/config.js";

import { z } from "zod";

const weakJwtSecrets = new Set([
  "change-me-before-deploying",
  "change-me",
  "secret",
  "development-secret",
]);

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    CLIENT_ORIGIN: z.string().url(),
    COOKIE_DOMAIN: z.string().optional().default(""),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().max(100).default(20),
    STORAGE_DIR: z.string().min(1).default("./private-storage"),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === "production" && weakJwtSecrets.has(env.JWT_SECRET)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must be replaced before production.",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(): AppEnv {
  return envSchema.parse(process.env);
}
