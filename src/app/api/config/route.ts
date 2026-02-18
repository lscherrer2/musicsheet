import { NextResponse } from 'next/server';
import { getConfigPath, ensureStorageStructure, existsSync, fs } from '@/lib/storage';
import type { AppConfig } from '@/types/document';

function createDefaultConfig(): AppConfig {
  return {
    version: '1.0',
    sortBy: 'lastAccessed',
    sortDirection: 'desc',
    lastOpenedDocumentId: null,
    recentDocuments: [],
  };
}

/**
 * GET /api/config - Load app configuration
 */
export async function GET() {
  try {
    await ensureStorageStructure();
    const configPath = getConfigPath();

    if (!existsSync(configPath)) {
      const defaultConfig = createDefaultConfig();
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      return NextResponse.json({ success: true, config: defaultConfig });
    }

    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data) as AppConfig;
    return NextResponse.json({ success: true, config });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load config' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/config - Update app configuration
 */
export async function PATCH(request: Request) {
  try {
    await ensureStorageStructure();
    const configPath = getConfigPath();
    const updates = await request.json();

    let config: AppConfig;
    if (existsSync(configPath)) {
      const data = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(data) as AppConfig;
    } else {
      config = createDefaultConfig();
    }

    // Merge updates
    const updatedConfig: AppConfig = { ...config, ...updates };
    await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8');

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update config' },
      { status: 500 }
    );
  }
}
