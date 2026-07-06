import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./api";

describe("api client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "csrf_token=; Max-Age=0; path=/";
  });

  it("returns null for unauthenticated current-user responses", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
        }),
        { status: 401 },
      ),
    );

    await expect(api.me()).resolves.toBeNull();
  });

  it("does not hide unexpected current-user response shapes", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await expect(api.me()).rejects.toThrow();
  });

  it("sends the CSRF token on mutating requests", async () => {
    document.cookie = "csrf_token=test-token; path=/";
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await api.deleteDataroom("00000000-0000-0000-0000-000000000001");

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("X-CSRF-Token")).toBe("test-token");
  });

  it("moves files with an explicit target folder", async () => {
    document.cookie = "csrf_token=test-token; path=/";
    const fileId = "00000000-0000-0000-0000-000000000001";
    const folderId = "00000000-0000-0000-0000-000000000002";

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          file: {
            id: fileId,
            dataroomId: "00000000-0000-0000-0000-000000000003",
            folderId,
            name: "Disclosure.pdf",
            mimeType: "application/pdf",
            sizeBytes: 2048,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        }),
        { status: 200 },
      ),
    );

    await expect(api.moveFile(fileId, folderId)).resolves.toMatchObject({
      id: fileId,
      folderId,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`http://localhost:3000/files/${fileId}/move`);
    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify({ folderId }));
    expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe("test-token");
  });

  it("uses the CSRF token returned by auth responses when no readable cookie exists", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: "00000000-0000-0000-0000-000000000001",
              email: "owner@example.com",
              name: "Owner",
            },
            csrfToken: "response-token",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    await api.login({
      email: "owner@example.com",
      password: "correct-horse",
    });
    await api.deleteDataroom("00000000-0000-0000-0000-000000000002");

    const deleteRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(new Headers(deleteRequest.headers).get("X-CSRF-Token")).toBe(
      "response-token",
    );
  });
});
