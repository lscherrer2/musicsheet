/**
 * Thumbnail service
 * Uses server actions for generation, API routes for serving images
 */
import { generateThumbnail as generateThumbnailAction } from '@/actions/thumbnail';

/**
 * Generate a thumbnail from a PDF document
 */
export async function generateThumbnail(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  return await generateThumbnailAction(documentId);
}

/**
 * Get the thumbnail URL for a document
 * Returns an HTTP URL to the thumbnail API endpoint
 */
export function getThumbnailUrl(documentId: string): string {
  return `/api/documents/${documentId}/thumbnail`;
}
