import { NextResponse } from 'next/server';
import {
  ensureStorageStructure,
  getIndexPath,
  getDocumentPath,
  getDocumentPdfPath,
  getDocumentMetadataPath,
  getDocumentThumbnailPath,
  fs,
  existsSync,
} from '@/lib/storage';
import type { DocumentIndex, DocumentMetadata, DocumentIndexEntry } from '@/types/document';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/documents - Get all documents from the index
 */
export async function GET() {
  try {
    await ensureStorageStructure();
    const indexPath = getIndexPath();

    if (!existsSync(indexPath)) {
      // Create default index
      const defaultIndex: DocumentIndex = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        documents: [],
      };
      await fs.writeFile(indexPath, JSON.stringify(defaultIndex, null, 2), 'utf-8');
      return NextResponse.json({ success: true, documents: [] });
    }

    const data = await fs.readFile(indexPath, 'utf-8');
    const index = JSON.parse(data) as DocumentIndex;
    return NextResponse.json({ success: true, documents: index.documents });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents - Upload a new document (PDF file + metadata)
 * Expects multipart form data with:
 * - file: PDF file
 * - fileName: original file name
 */
export async function POST(request: Request) {
  try {
    await ensureStorageStructure();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileName = (formData.get('fileName') as string) || 'document.pdf';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const documentId = uuidv4();
    const docPath = getDocumentPath(documentId);

    // Create document directory
    await fs.mkdir(docPath, { recursive: true });

    // Write PDF file
    const pdfPath = getDocumentPdfPath(documentId);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(pdfPath, Buffer.from(arrayBuffer));

    // Create metadata
    const now = new Date().toISOString();
    const metadata: DocumentMetadata = {
      id: documentId,
      title: fileName.replace('.pdf', ''),
      composer: '',
      instrument: '',
      dateAdded: now,
      lastAccessed: now,
      fileName,
      fileSize: file.size,
      sortOrder: 0,
      sideBySide: true,
      pageOffset: false,
    };

    // Save metadata
    const metadataPath = getDocumentMetadataPath(documentId);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    // Update index
    const indexPath = getIndexPath();
    let index: DocumentIndex;

    if (existsSync(indexPath)) {
      const indexData = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(indexData) as DocumentIndex;
    } else {
      index = { version: '1.0', lastUpdated: now, documents: [] };
    }

    const indexEntry: DocumentIndexEntry = {
      id: metadata.id,
      title: metadata.title,
      composer: metadata.composer,
      instrument: metadata.instrument,
      dateAdded: metadata.dateAdded,
      lastAccessed: metadata.lastAccessed,
    };

    index.documents.push(indexEntry);
    index.lastUpdated = now;
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');

    // Generate thumbnail (non-blocking)
    generateThumbnailAsync(documentId).catch((err) => {
      console.warn('Thumbnail generation failed:', err);
    });

    return NextResponse.json({ success: true, documentId, metadata });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    );
  }
}

/**
 * Generate thumbnail using qlmanage (macOS) as a background task
 */
async function generateThumbnailAsync(documentId: string): Promise<void> {
  const pdfPath = getDocumentPdfPath(documentId);
  const thumbnailPath = getDocumentThumbnailPath(documentId);

  if (!existsSync(pdfPath)) return;

  try {
    const { execFile } = await import('child_process');
    const os = await import('os');
    const path = await import('path');

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'musicsheet-thumb-'));

    await new Promise<void>((resolve, reject) => {
      execFile('qlmanage', ['-t', '-s', '400', '-o', tmpDir, pdfPath], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const pdfBaseName = path.basename(pdfPath);
    const generatedPath = path.join(tmpDir, `${pdfBaseName}.png`);

    if (existsSync(generatedPath)) {
      await fs.copyFile(generatedPath, thumbnailPath);
    } else {
      const files = await fs.readdir(tmpDir);
      const pngFile = files.find((f) => f.endsWith('.png'));
      if (pngFile) {
        await fs.copyFile(path.join(tmpDir, pngFile), thumbnailPath);
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // Thumbnail generation is best-effort
    console.warn('Thumbnail generation failed for', documentId);
  }
}
