import { createReadStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { loadEnv } from "../config/env.js";

const storageKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,16}$/i;
const storageExtensionPattern = /^[a-z0-9]{1,16}$/i;

@Injectable()
export class StorageService {
  private readonly storageRoot = resolve(process.cwd(), loadEnv().STORAGE_DIR);

  async savePrivateFile(buffer: Buffer, extension: string): Promise<string> {
    const storageKey = `${randomUUID()}.${normalizeStorageExtension(extension)}`;
    const path = this.resolveStoragePath(storageKey);

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer, { flag: "wx" });

    return storageKey;
  }

  openReadStream(storageKey: string) {
    return createReadStream(this.resolveStoragePath(storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.resolveStoragePath(storageKey), { force: true });
  }

  private resolveStoragePath(storageKey: string): string {
    if (!storageKeyPattern.test(storageKey)) {
      throw new Error("Invalid storage key.");
    }

    return join(this.storageRoot, storageKey);
  }
}

function normalizeStorageExtension(extension: string): string {
  const normalized = extension.trim().toLowerCase();

  return storageExtensionPattern.test(normalized) ? normalized : "bin";
}
