import { randomBytes } from "node:crypto";

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import {
  loginRequestSchema,
  registerRequestSchema,
} from "@secure-room/api-contract";
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "@secure-room/api-contract";

import { CurrentUser } from "../common/current-user.decorator.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { loadEnv } from "../config/env.js";
import { AuthService } from "./auth.service.js";
import { csrfCookieName, sessionCookieName } from "./cookie-names.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async register(
    @Body(new ZodValidationPipe(registerRequestSchema)) body: RegisterRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(body);
    this.setSessionCookies(response, session.token);
    return { user: session.user };
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(body);
    this.setSessionCookies(response, session.token);
    return { user: session.user };
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(sessionCookieName, this.sessionCookieOptions());
    response.clearCookie(csrfCookieName, this.csrfCookieOptions());
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.setCsrfCookie(response);
    return { user };
  }

  private setSessionCookies(response: Response, token: string): void {
    response.cookie(sessionCookieName, token, {
      ...this.sessionCookieOptions(),
      maxAge: 1000 * 60 * 60 * 8,
    });
    this.setCsrfCookie(response);
  }

  private setCsrfCookie(response: Response): void {
    response.cookie(csrfCookieName, randomBytes(32).toString("base64url"), {
      ...this.csrfCookieOptions(),
      maxAge: 1000 * 60 * 60 * 8,
    });
  }

  private baseCookieOptions() {
    const env = loadEnv();

    return {
      secure: env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      domain: env.COOKIE_DOMAIN || undefined,
    };
  }

  private sessionCookieOptions() {
    return {
      ...this.baseCookieOptions(),
      httpOnly: true,
    };
  }

  private csrfCookieOptions() {
    return {
      ...this.baseCookieOptions(),
      httpOnly: false,
    };
  }
}
