/**
 * Server Actions Index
 * 
 * This file re-exports all server actions for easier imports.
 * Server actions replace traditional API routes for data mutations and queries.
 * 
 * Note: API routes are still used for file streaming (PDF and thumbnail GET endpoints)
 * as server actions are not designed for streaming binary data.
 */

// Document actions
export { getDocuments, uploadDocument, deleteDocument } from './documents';

// Metadata actions
export { getDocumentMetadata, updateDocumentMetadata } from './metadata';

// Config actions
export { getConfig, updateConfig } from './config';

// Storage actions
export { initializeStorage } from './storage';

// Thumbnail actions
export { generateThumbnail } from './thumbnail';
