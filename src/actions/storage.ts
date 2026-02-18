'use server';

import { ensureStorageStructure } from '@/lib/storage';

/**
 * Server action to initialize storage directory structure
 */
export async function initializeStorage(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ensureStorageStructure();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize storage',
    };
  }
}
