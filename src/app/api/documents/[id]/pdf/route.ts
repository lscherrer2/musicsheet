import { NextResponse } from 'next/server';
import { getDocumentPdfPath, existsSync } from '@/lib/storage';
import { readFile } from 'fs/promises';

/**
 * GET /api/documents/[id]/pdf - Stream the PDF file
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const pdfPath = getDocumentPdfPath(documentId);

    if (!existsSync(pdfPath)) {
      return NextResponse.json(
        { success: false, error: 'PDF not found' },
        { status: 404 }
      );
    }

    const buffer = await readFile(pdfPath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to read PDF' },
      { status: 500 }
    );
  }
}
