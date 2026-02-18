'use server';

import {
  getDocumentThumbnailPath,
  getDocumentPdfPath,
  existsSync,
  fs,
} from '@/lib/storage';

/**
 * Server action to generate thumbnail for a document
 */
export async function generateThumbnail(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const pdfPath = getDocumentPdfPath(documentId);
    const thumbnailPath = getDocumentThumbnailPath(documentId);

    if (!existsSync(pdfPath)) {
      return { success: false, error: 'PDF not found' };
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
        return { success: false, error: 'Failed to generate thumbnail' };
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate thumbnail',
    };
  }
}
