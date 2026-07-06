import {
  apiRoutes,
  authUserSchema,
  dataroomSchema,
  dataroomTreeSchema,
  fileRecordSchema,
  folderSchema,
  searchResultSchema,
} from "@secure-room/api-contract";
import type {
  AuthUser,
  Dataroom,
  DataroomTree,
  FileRecord,
  Folder,
  LoginRequest,
  RegisterRequest,
  SearchResult,
} from "@secure-room/api-contract";
import { z } from "zod";

import { ApiClientError, parseApiError } from "./api-error";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const csrfCookieName = "csrf_token";
const csrfHeaderName = "X-CSRF-Token";
const authTokenStorageKey = "secure_room_access_token";
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let responseCsrfToken: string | null = null;

type RequestOptions = RequestInit & {
  body?: BodyInit | null;
};

async function request<T>(
  path: string,
  schema: z.ZodSchema<T>,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const method = options.method ?? "GET";

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const authToken = getStoredAuthToken();
  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const csrfToken = getCsrfToken();
  if (unsafeMethods.has(method.toUpperCase()) && csrfToken) {
    headers.set(csrfHeaderName, csrfToken);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return schema.parse({});
  }

  const parsed = schema.parse(await response.json());
  rememberResponseCsrfToken(parsed);
  rememberResponseAuthToken(parsed);
  return parsed;
}

const userResponseSchema = z.object({
  user: authUserSchema,
  csrfToken: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
});
const dataroomsResponseSchema = z.object({
  datarooms: z.array(dataroomSchema),
});
const dataroomResponseSchema = z.object({ dataroom: dataroomSchema });
const folderResponseSchema = z.object({ folder: folderSchema });
const fileResponseSchema = z.object({ file: fileRecordSchema });
const okResponseSchema = z.object({ ok: z.literal(true) }).or(z.object({}));

export const api = {
  async me(): Promise<AuthUser | null> {
    try {
      const response = await request(apiRoutes.auth.me, userResponseSchema);
      return response.user;
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        [401, 403].includes(error.status)
      ) {
        return null;
      }

      throw error;
    }
  },

  async login(input: LoginRequest): Promise<AuthUser> {
    const response = await request(apiRoutes.auth.login, userResponseSchema, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.user;
  },

  async register(input: RegisterRequest): Promise<AuthUser> {
    const response = await request(
      apiRoutes.auth.register,
      userResponseSchema,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    return response.user;
  },

  async logout(): Promise<void> {
    try {
      await request(apiRoutes.auth.logout, z.object({}), { method: "POST" });
    } finally {
      clearStoredAuthToken();
      responseCsrfToken = null;
    }
  },

  async listDatarooms(): Promise<Dataroom[]> {
    const response = await request(
      apiRoutes.datarooms.list,
      dataroomsResponseSchema,
    );
    return response.datarooms;
  },

  async createDataroom(name: string): Promise<Dataroom> {
    const response = await request(
      apiRoutes.datarooms.create,
      dataroomResponseSchema,
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
    );
    return response.dataroom;
  },

  async renameDataroom(id: string, name: string): Promise<Dataroom> {
    const response = await request(
      apiRoutes.datarooms.byId(id),
      dataroomResponseSchema,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      },
    );
    return response.dataroom;
  },

  async deleteDataroom(id: string): Promise<void> {
    await request(apiRoutes.datarooms.byId(id), okResponseSchema, {
      method: "DELETE",
    });
  },

  async getTree(id: string): Promise<DataroomTree> {
    return request(apiRoutes.datarooms.tree(id), dataroomTreeSchema);
  },

  async createFolder(input: {
    dataroomId: string;
    parentFolderId: string | null;
    name: string;
  }): Promise<Folder> {
    const response = await request(
      apiRoutes.folders.create,
      folderResponseSchema,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
    return response.folder;
  },

  async renameFolder(id: string, name: string): Promise<Folder> {
    const response = await request(
      apiRoutes.folders.byId(id),
      folderResponseSchema,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      },
    );
    return response.folder;
  },

  async deleteFolder(id: string): Promise<void> {
    await request(apiRoutes.folders.byId(id), okResponseSchema, {
      method: "DELETE",
    });
  },

  async renameFile(id: string, name: string): Promise<FileRecord> {
    const response = await request(
      apiRoutes.files.byId(id),
      fileResponseSchema,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      },
    );
    return response.file;
  },

  async moveFile(id: string, folderId: string | null): Promise<FileRecord> {
    const response = await request(
      apiRoutes.files.move(id),
      fileResponseSchema,
      {
        method: "PATCH",
        body: JSON.stringify({ folderId }),
      },
    );
    return response.file;
  },

  async deleteFile(id: string): Promise<void> {
    await request(apiRoutes.files.byId(id), okResponseSchema, {
      method: "DELETE",
    });
  },

  async search(dataroomId: string, query: string): Promise<SearchResult> {
    const params = new URLSearchParams({ dataroomId, q: query });
    return request(
      `${apiRoutes.search}?${params.toString()}`,
      searchResultSchema,
    );
  },

  previewUrl(fileId: string): string {
    return `${apiUrl}${apiRoutes.files.preview(fileId)}`;
  },

  downloadUrl(fileId: string): string {
    return `${apiUrl}${apiRoutes.files.download(fileId)}`;
  },

  authHeaders(): HeadersInit {
    const authToken = getStoredAuthToken();
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  },
};

export function uploadFile(input: {
  dataroomId: string;
  folderId: string | null;
  file: File;
  onProgress: (value: number) => void;
}): Promise<FileRecord> {
  const formData = new FormData();
  formData.set("dataroomId", input.dataroomId);
  if (input.folderId) {
    formData.set("folderId", input.folderId);
  }
  formData.set("file", input.file);

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${apiUrl}${apiRoutes.files.upload}`);
    request.withCredentials = true;

    const csrfToken = getCsrfToken();
    if (csrfToken) {
      request.setRequestHeader(csrfHeaderName, csrfToken);
    }

    const authToken = getStoredAuthToken();
    if (authToken) {
      request.setRequestHeader("Authorization", `Bearer ${authToken}`);
    }

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        input.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(parseUploadError(request.responseText)));
        return;
      }

      try {
        const parsed = fileResponseSchema.parse(
          JSON.parse(request.responseText),
        );
        resolve(parsed.file);
      } catch (error) {
        reject(error);
      }
    });

    request.addEventListener("error", () =>
      reject(new Error("Upload failed.")),
    );
    request.send(formData);
  });
}

function parseUploadError(responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as unknown;
    if (
      typeof parsed === "object" &&
      parsed &&
      "message" in parsed &&
      typeof parsed.message === "string"
    ) {
      return parsed.message;
    }
  } catch {
    return "Upload failed.";
  }

  return "Upload failed.";
}

function readCookie(name: string): string | null {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const prefix = `${name}=`;
  const cookie = cookies.find((value) => value.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

function getCsrfToken(): string | null {
  return readCookie(csrfCookieName) ?? responseCsrfToken;
}

function rememberResponseCsrfToken(value: unknown): void {
  if (
    typeof value === "object" &&
    value !== null &&
    "csrfToken" in value &&
    typeof value.csrfToken === "string" &&
    value.csrfToken.length > 0
  ) {
    responseCsrfToken = value.csrfToken;
  }
}

function rememberResponseAuthToken(value: unknown): void {
  if (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0
  ) {
    setStoredAuthToken(value.accessToken);
  }
}

function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(authTokenStorageKey);
  } catch {
    return null;
  }
}

function setStoredAuthToken(token: string): void {
  try {
    localStorage.setItem(authTokenStorageKey, token);
  } catch {
    return;
  }
}

function clearStoredAuthToken(): void {
  try {
    localStorage.removeItem(authTokenStorageKey);
  } catch {
    return;
  }
}

export function resetApiClientStateForTests(): void {
  responseCsrfToken = null;
  clearStoredAuthToken();
}
