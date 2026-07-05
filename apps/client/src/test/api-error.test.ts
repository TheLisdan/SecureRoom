import { describe, expect, it } from "vitest";

import {
  ApiClientError,
  getErrorMessage,
  parseApiError,
} from "../lib/api-error";

describe("api error helpers", () => {
  it("parses typed API errors from failed responses", async () => {
    const error = await parseApiError(
      new Response(
        JSON.stringify({
          code: "CONFLICT",
          message: "A file with this name already exists here.",
        }),
        { status: 409 },
      ),
    );

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      code: "CONFLICT",
      message: "A file with this name already exists here.",
      status: 409,
    });
  });

  it("falls back for non-API error bodies", async () => {
    const error = await parseApiError(
      new Response("not json", {
        status: 502,
      }),
    );

    expect(error).toMatchObject({
      code: "REQUEST_FAILED",
      message: "The request failed.",
      status: 502,
    });
  });

  it("normalizes unknown UI errors to safe copy", () => {
    expect(getErrorMessage(new Error("Upload failed."))).toBe("Upload failed.");
    expect(getErrorMessage(null)).toBe("Something went wrong.");
  });
});
