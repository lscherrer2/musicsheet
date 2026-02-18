/**
 * Client-side storage service
 * Uses server actions instead of API routes
 */
import { initializeStorage } from '@/actions/storage';
import { deleteDocument as deleteDocumentAction } from '@/actions/documents';

/**
 * Ensure the storage directory structure exists
 */
export async function ensureStorageStructure(): Promise<void> {
  await initializeStorage();
}

/**
 * Delete a document folder and all its contents
 */
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  return await deleteDocumentAction(documentId);
}
