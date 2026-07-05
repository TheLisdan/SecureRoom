import type { Dataroom, FileRecord, Folder } from "@secure-room/api-contract";

import { toIsoDate } from "../common/date-mapper.js";

type DataroomRow = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type FolderRow = {
  id: string;
  dataroomId: string;
  parentFolderId: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type FileRow = {
  id: string;
  dataroomId: string;
  folderId: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
};

export function mapDataroom(row: DataroomRow): Dataroom {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt),
  };
}

export function mapFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    dataroomId: row.dataroomId,
    parentFolderId: row.parentFolderId,
    name: row.name,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt),
  };
}

export function mapFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    dataroomId: row.dataroomId,
    folderId: row.folderId,
    name: row.name,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: toIsoDate(row.createdAt),
    updatedAt: toIsoDate(row.updatedAt),
  };
}
