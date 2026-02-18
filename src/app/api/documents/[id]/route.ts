import { NextResponse } from 'next/server';
import {
  getDocumentPath,
  getIndexPath,
  fs,
  existsSync,
} from '@/lib/storage';
import type { DocumentIndex } from '@/types/document';

/**
 * DELETE /api/documents/[id] - Delete a document and remove from index
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const docPath = getDocumentPath(documentId);

    // Delete document directory
    if (existsSync(docPath)) {
      await fs.rm(docPath, { recursive: true, force: true });
    }

    // Remove from index
    const indexPath = getIndexPath();
    if (existsSync(indexPath)) {
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData) as DocumentIndex;
      index.documents = index.documents.filter((doc) => doc.id !== documentId);
      index.lastUpdated = new Date().toISOString();
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 }
    );
  }
}
