import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export type StoredFile = {
  storageKey: string;
  absolutePath: string;
};

export class LocalFileStorage {
  async store(params: {
    buffer: Buffer;
    extension: string;
  }): Promise<StoredFile> {
    await fs.mkdir(env.uploadDir, { recursive: true });

    const storageKey = `${crypto.randomUUID()}${params.extension}`;
    const absolutePath = path.join(env.uploadDir, storageKey);
    await fs.writeFile(absolutePath, params.buffer);

    return { storageKey, absolutePath };
  }

  getAbsolutePath(storageKey: string) {
    return path.join(env.uploadDir, storageKey);
  }
}

export const fileStorage = new LocalFileStorage();
