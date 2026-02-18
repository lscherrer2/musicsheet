/**
 * Server-side storage utilities
 * Replaces Electron IPC file operations with direct Node.js fs calls
 */
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const FILE_NAMES = {
  PDF: "score.pdf",
  METADATA: "metadata.json",
  THUMBNAIL: "thumbnail.png",
  INDEX: "index.json",
  CONFIG: "config.json",
} as const;

const DIR_NAMES = {
  DOCUMENTS: "documents",
} as const;

/**
 * Get the base storage path (project-local data directory)
 */
export function getBaseStoragePath(): string {
  return path.join(process.cwd(), "data", "musicsheet");
}

export function getDocumentsPath(): string {
  return path.join(getBaseStoragePath(), DIR_NAMES.DOCUMENTS);
}

export function getIndexPath(): string {
  return path.join(getBaseStoragePath(), FILE_NAMES.INDEX);
}

export function getConfigPath(): string {
  return path.join(getBaseStoragePath(), FILE_NAMES.CONFIG);
}

export function getDocumentPath(documentId: string): string {
  return path.join(getDocumentsPath(), documentId);
}

export function getDocumentPdfPath(documentId: string): string {
  return path.join(getDocumentPath(documentId), FILE_NAMES.PDF);
}

export function getDocumentMetadataPath(documentId: string): string {
  return path.join(getDocumentPath(documentId), FILE_NAMES.METADATA);
}

export function getDocumentThumbnailPath(documentId: string): string {
  return path.join(getDocumentPath(documentId), FILE_NAMES.THUMBNAIL);
}

/**
 * Ensure the storage directory structure exists
 */
export async function ensureStorageStructure(): Promise<void> {
  const basePath = getBaseStoragePath();
  const documentsPath = getDocumentsPath();

  if (!existsSync(basePath)) {
    await fs.mkdir(basePath, { recursive: true });
  }
  if (!existsSync(documentsPath)) {
    await fs.mkdir(documentsPath, { recursive: true });
  }
}

export { fs, existsSync, FILE_NAMES, DIR_NAMES };
