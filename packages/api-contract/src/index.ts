import { z } from "zod";

export const idSchema = z.string().uuid();

export const isoDateSchema = z.string().datetime();

export const emailSchema = z
  .string()
  .email()
  .max(255)
  .transform((value) => value.toLowerCase());

export const displayNameSchema = z.string().trim().min(2).max(80);

export const dataroomNameSchema = z.string().trim().min(2).max(120);

export const itemNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .refine(
    (value) => !/[\\/:*?"<>|\u0000-\u001f]/.test(value),
    "Name contains characters that are not allowed.",
  );

export const folderNameSchema = itemNameSchema;
export const fileNameSchema = itemNameSchema;

export const passwordSchema = z.string().min(10).max(128);

export const authUserSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  name: z.string(),
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const registerRequestSchema = z.object({
  email: emailSchema,
  name: displayNameSchema,
  password: passwordSchema,
});

export const dataroomSchema = z.object({
  id: idSchema,
  name: dataroomNameSchema,
  ownerId: idSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const folderSchema = z.object({
  id: idSchema,
  dataroomId: idSchema,
  parentFolderId: idSchema.nullable(),
  name: folderNameSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const fileRecordSchema = z.object({
  id: idSchema,
  dataroomId: idSchema,
  folderId: idSchema.nullable(),
  name: fileNameSchema,
  mimeType: z.string().min(1).max(127),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const auditActionSchema = z.enum([
  "AUTH_LOGIN",
  "DATAROOM_CREATE",
  "DATAROOM_RENAME",
  "DATAROOM_DELETE",
  "FOLDER_CREATE",
  "FOLDER_RENAME",
  "FOLDER_DELETE",
  "FILE_UPLOAD",
  "FILE_PREVIEW",
  "FILE_DOWNLOAD",
  "FILE_RENAME",
  "FILE_MOVE",
  "FILE_DELETE",
]);

export const auditLogSchema = z.object({
  id: idSchema,
  userId: idSchema,
  dataroomId: idSchema.nullable(),
  entityType: z.string(),
  entityId: idSchema.nullable(),
  action: auditActionSchema,
  createdAt: isoDateSchema,
});

export const createDataroomRequestSchema = z.object({
  name: dataroomNameSchema,
});

export const renameDataroomRequestSchema = z.object({
  name: dataroomNameSchema,
});

export const createFolderRequestSchema = z.object({
  dataroomId: idSchema,
  parentFolderId: idSchema.nullable().optional(),
  name: folderNameSchema,
});

export const renameFolderRequestSchema = z.object({
  name: folderNameSchema,
});

export const renameFileRequestSchema = z.object({
  name: fileNameSchema,
});

export const moveFileRequestSchema = z.object({
  folderId: idSchema.nullable(),
});

export const dataroomTreeSchema = z.object({
  dataroom: dataroomSchema,
  folders: z.array(folderSchema),
  files: z.array(fileRecordSchema),
});

export const searchResultSchema = z.object({
  folders: z.array(folderSchema),
  files: z.array(fileRecordSchema),
});

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  details: z.unknown().optional(),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type Dataroom = z.infer<typeof dataroomSchema>;
export type Folder = z.infer<typeof folderSchema>;
export type FileRecord = z.infer<typeof fileRecordSchema>;
export type AuditAction = z.infer<typeof auditActionSchema>;
export type AuditLog = z.infer<typeof auditLogSchema>;
export type DataroomTree = z.infer<typeof dataroomTreeSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;

export type FileManagerItem =
  | {
      type: "folder";
      id: string;
      name: string;
      parentFolderId: string | null;
      updatedAt: string;
      folder: Folder;
    }
  | {
      type: "file";
      id: string;
      name: string;
      folderId: string | null;
      updatedAt: string;
      file: FileRecord;
    };

export const apiRoutes = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  datarooms: {
    list: "/datarooms",
    create: "/datarooms",
    byId: (id: string) => `/datarooms/${id}`,
    tree: (id: string) => `/datarooms/${id}/tree`,
  },
  folders: {
    create: "/folders",
    byId: (id: string) => `/folders/${id}`,
  },
  files: {
    upload: "/files/upload",
    byId: (id: string) => `/files/${id}`,
    move: (id: string) => `/files/${id}/move`,
    preview: (id: string) => `/files/${id}/preview`,
    download: (id: string) => `/files/${id}/download`,
  },
  search: "/search",
} as const;

export function isApiError(value: unknown): value is ApiError {
  return apiErrorSchema.safeParse(value).success;
}
