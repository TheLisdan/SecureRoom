import type { Request } from "express";
import type { AuthUser } from "@secure-room/api-contract";

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};
