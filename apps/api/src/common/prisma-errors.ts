import { Prisma } from "@prisma/client";

import { conflict } from "./domain-error.js";

export function throwConflictOnUniqueConstraint(
  error: unknown,
  message: string,
): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw conflict(message);
  }

  throw error;
}
