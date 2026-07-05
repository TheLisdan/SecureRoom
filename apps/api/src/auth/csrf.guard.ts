import { timingSafeEqual } from "node:crypto";

import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { forbidden } from "../common/domain-error.js";
import { csrfCookieName, sessionCookieName } from "./cookie-names.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const csrfExemptPaths = new Set(["/auth/login", "/auth/register"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (
      !unsafeMethods.has(request.method) ||
      csrfExemptPaths.has(request.path)
    ) {
      return true;
    }

    if (!request.cookies?.[sessionCookieName]) {
      return true;
    }

    const cookieToken = request.cookies?.[csrfCookieName];
    const headerToken = request.headers["x-csrf-token"];

    if (typeof cookieToken !== "string" || typeof headerToken !== "string") {
      throw forbidden("CSRF token is missing.");
    }

    if (!tokensMatch(cookieToken, headerToken)) {
      throw forbidden("CSRF token is invalid.");
    }

    return true;
  }
}

function tokensMatch(cookieToken: string, headerToken: string): boolean {
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (cookieBuffer.length !== headerBuffer.length) {
    return false;
  }

  return timingSafeEqual(cookieBuffer, headerBuffer);
}
