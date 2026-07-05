import { isApiError } from "@secure-room/api-contract";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function parseApiError(
  response: Response,
): Promise<ApiClientError> {
  const fallback = new ApiClientError(
    "REQUEST_FAILED",
    "The request failed.",
    response.status,
  );

  try {
    const body: unknown = await response.json();
    if (isApiError(body)) {
      return new ApiClientError(body.code, body.message, response.status);
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}
