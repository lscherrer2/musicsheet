import type {
  DocumentMetadata,
  UpdateDocumentMetadata,
} from '../types/document';
import { getDocumentMetadata, updateDocumentMetadata } from '@/actions/metadata';

/**
 * Load metadata for a document
 */
export async function loadMetadata(
  documentId: string
): Promise<{ success: boolean; metadata?: DocumentMetadata; error?: string }> {
  return await getDocumentMetadata(documentId);
}

/**
 * Update specific fields in document metadata
 */
export async function updateMetadata(
  documentId: string,
  updates: UpdateDocumentMetadata
): Promise<{ success: boolean; metadata?: DocumentMetadata; error?: string }> {
  return await updateDocumentMetadata(documentId, updates);
}

/**
 * Update the lastAccessed timestamp for a document
 */
export async function updateLastAccessed(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const result = await updateMetadata(documentId, { lastAccessed: now });
  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Validate metadata structure
 */
export function isValidMetadata(data: unknown): data is DocumentMetadata {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const metadata = data as Partial<DocumentMetadata>;

  return (
    typeof metadata.id === 'string' &&
    typeof metadata.title === 'string' &&
    typeof metadata.composer === 'string' &&
    typeof metadata.instrument === 'string' &&
    typeof metadata.dateAdded === 'string' &&
    typeof metadata.lastAccessed === 'string' &&
    typeof metadata.fileName === 'string' &&
    typeof metadata.fileSize === 'number' &&
    typeof metadata.sortOrder === 'number'
  );
}
