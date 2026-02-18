import type {
  DocumentIndexEntry,
  DocumentMetadata,
} from '../types/document';
import { getDocuments, deleteDocument } from '@/actions/documents';

/**
 * Get all documents from the index
 */
export async function getAllDocuments(): Promise<{
  success: boolean;
  documents?: DocumentIndexEntry[];
  error?: string;
}> {
  return await getDocuments();
}

/**
 * Remove a document from the index (and delete files)
 */
export async function removeFromIndex(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  return await deleteDocument(documentId);
}

/**
 * Update an entry in the index (done automatically via metadata PATCH)
 */
export async function updateIndexEntry(
  metadata: DocumentMetadata
): Promise<{ success: boolean; error?: string }> {
  // Index is updated server-side when metadata is patched
  // This is a no-op on the client side now
  void metadata;
  return { success: true };
}

/**
 * Sort documents by a field
 */
export function sortDocuments(
  documents: DocumentIndexEntry[],
  sortBy: 'title' | 'composer' | 'dateAdded' | 'lastAccessed',
  direction: 'asc' | 'desc' = 'asc'
): DocumentIndexEntry[] {
  const sorted = [...documents].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortBy) {
      case 'title':
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        break;
      case 'composer':
        aVal = a.composer.toLowerCase();
        bVal = b.composer.toLowerCase();
        break;
      case 'dateAdded':
        aVal = new Date(a.dateAdded).getTime();
        bVal = new Date(b.dateAdded).getTime();
        break;
      case 'lastAccessed':
        aVal = new Date(a.lastAccessed).getTime();
        bVal = new Date(b.lastAccessed).getTime();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}
