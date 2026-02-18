'use server';

import {
  getDocumentMetadataPath,
  getIndexPath,
  existsSync,
  fs,
} from '@/lib/storage';
import type { DocumentMetadata, DocumentIndex, DocumentIndexEntry } from '@/types/document';

/**
 * Server action to get metadata for a document
 */
export async function getDocumentMetadata(documentId: string): Promise<{
  success: boolean;
  metadata?: DocumentMetadata;
  error?: string;
}> {
  try {
    const metadataPath = getDocumentMetadataPath(documentId);

    if (!existsSync(metadataPath)) {
      return { success: false, error: 'Metadata not found' };
    }

    const data = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(data) as DocumentMetadata;

    // Provide defaults for new fields (backwards compatibility)
    if (metadata.sideBySide === undefined) {
      metadata.sideBySide = true;
    }
    if (metadata.pageOffset === undefined) {
      metadata.pageOffset = false;
    }

    return { success: true, metadata };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read metadata',
    };
  }
}

/**
 * Server action to update metadata for a document
 * Also updates the index entry
 */
export async function updateDocumentMetadata(
  documentId: string,
  updates: Partial<DocumentMetadata>
): Promise<{
  success: boolean;
  metadata?: DocumentMetadata;
  error?: string;
}> {
  try {
    const metadataPath = getDocumentMetadataPath(documentId);

    if (!existsSync(metadataPath)) {
      return { success: false, error: 'Metadata not found' };
    }

    // Load existing metadata
    const data = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(data) as DocumentMetadata;

    // Merge updates
    const updatedMetadata: DocumentMetadata = {
      ...metadata,
      ...updates,
    };

    // Save updated metadata
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2), 'utf-8');

    // Update index entry
    const indexPath = getIndexPath();
    if (existsSync(indexPath)) {
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData) as DocumentIndex;

      const indexEntry: DocumentIndexEntry = {
        id: updatedMetadata.id,
        title: updatedMetadata.title,
        composer: updatedMetadata.composer,
        instrument: updatedMetadata.instrument,
        dateAdded: updatedMetadata.dateAdded,
        lastAccessed: updatedMetadata.lastAccessed,
      };

      const docIndex = index.documents.findIndex((doc) => doc.id === documentId);
      if (docIndex !== -1) {
        index.documents[docIndex] = indexEntry;
      }

      index.lastUpdated = new Date().toISOString();
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    }

    return { success: true, metadata: updatedMetadata };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update metadata',
    };
  }
}
