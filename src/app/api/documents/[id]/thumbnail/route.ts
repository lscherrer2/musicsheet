import { NextResponse } from 'next/server';
import {
  getDocumentThumbnailPath,
  getDocumentPdfPath,
  existsSync,
  fs,
} from '@/lib/storage';

/**
 * GET /api/documents/[id]/thumbnail - Serve the thumbnail image
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const thumbnailPath = getDocumentThumbnailPath(documentId);

    if (!existsSync(thumbnailPath)) {
      return NextResponse.json(
        { success: false, error: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    const buffer = await fs.readFile(thumbnailPath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to read thumbnail' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/[id]/thumbnail - Generate thumbnail for a document
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const pdfPath = getDocumentPdfPath(documentId);
    const thumbnailPath = getDocumentThumbnailPath(documentId);

    if (!existsSync(pdfPath)) {
      return NextResponse.json(
        { success: false, error: 'PDF not found' },
        { status: 404 }
      );
    }

    // Generate thumbnail using macOS qlmanage
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
      } else {
        await fs.rm(tmpDir, { recursive: true, force: true });
        return NextResponse.json(
          { success: false, error: 'Failed to generate thumbnail' },
          { status: 500 }
        );
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate thumbnail' },
      { status: 500 }
    );
  }
}
