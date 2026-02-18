/**
 * Metadata for a single sheet music document
 */
export interface DocumentMetadata {
  id: string;
  title: string;
  composer: string;
  instrument: string;
  dateAdded: string; // ISO 8601 format
  lastAccessed: string; // ISO 8601 format
  fileName: string;
  fileSize: number;
  sortOrder: number;
  // PDF viewer settings
  sideBySide: boolean; // true = side-by-side, false = single page
  pageOffset: boolean; // true = +1 offset (1, 2-3, 4-5), false = +0 (1-2, 3-4)
}

/**
 * Lightweight index entry for fast searching/filtering
 */
export interface DocumentIndexEntry {
  id: string;
  title: string;
  composer: string;
  instrument: string;
  dateAdded: string;
  lastAccessed: string;
}

/**
 * Main index structure loaded on app startup
 */
export interface DocumentIndex {
  version: string;
  lastUpdated: string; // ISO 8601 format
  documents: DocumentIndexEntry[];
}

/**
 * Application configuration
 */
export interface AppConfig {
  version: string;
  sortBy: 'title' | 'composer' | 'dateAdded' | 'lastAccessed';
  sortDirection: 'asc' | 'desc';
  lastOpenedDocumentId: string | null;
  recentDocuments: string[]; // Array of document IDs (max 5)
}

/**
 * Partial metadata for creating new documents
 */
export type CreateDocumentMetadata = Partial<Omit<DocumentMetadata, 'id' | 'dateAdded' | 'lastAccessed' | 'sortOrder'>> & {
  fileName: string;
  fileSize: number;
};

/**
 * Partial metadata for updating documents
 */
export type UpdateDocumentMetadata = Partial<Omit<DocumentMetadata, 'id' | 'dateAdded' | 'fileName' | 'fileSize'>>;
