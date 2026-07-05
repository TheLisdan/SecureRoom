import { HttpException, HttpStatus } from "@nestjs/common";

export class DomainError extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}

export function badRequest(
  code: string,
  message: string,
  details?: unknown,
): DomainError {
  return new DomainError(code, message, HttpStatus.BAD_REQUEST, details);
}

export function unauthorized(
  message = "Authentication is required.",
): DomainError {
  return new DomainError("UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
}

export function forbidden(
  message = "You do not have access to this resource.",
): DomainError {
  return new DomainError("FORBIDDEN", message, HttpStatus.FORBIDDEN);
}

export function notFound(message = "Resource was not found."): DomainError {
  return new DomainError("NOT_FOUND", message, HttpStatus.NOT_FOUND);
}

export function conflict(message: string): DomainError {
  return new DomainError("CONFLICT", message, HttpStatus.CONFLICT);
}

export function unsupportedMediaType(
  code: string,
  message: string,
  details?: unknown,
): DomainError {
  return new DomainError(
    code,
    message,
    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    details,
  );
}
