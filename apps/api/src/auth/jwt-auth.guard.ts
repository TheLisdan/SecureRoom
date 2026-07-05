import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { unauthorized } from "../common/domain-error.js";
import type { AuthenticatedRequest } from "../common/request-types.js";
import { AuthService } from "./auth.service.js";

type JwtPayload = {
  sub: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.getToken(request);

    if (!token) {
      throw unauthorized();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = await this.authService.getUserForSession(payload.sub);
      return true;
    } catch {
      throw unauthorized("Your session is invalid or expired.");
    }
  }

  private getToken(request: AuthenticatedRequest): string | undefined {
    const cookieToken = request.cookies?.access_token;

    if (typeof cookieToken === "string" && cookieToken.length > 0) {
      return cookieToken;
    }

    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return undefined;
    }

    return header.slice("Bearer ".length);
  }
}
