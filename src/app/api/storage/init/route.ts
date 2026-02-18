import { NextResponse } from 'next/server';
import { ensureStorageStructure } from '@/lib/storage';

/**
 * POST /api/storage/init - Initialize storage directory structure
 */
export async function POST() {
  try {
    await ensureStorageStructure();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to initialize storage' },
      { status: 500 }
    );
  }
}
