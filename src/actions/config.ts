'use server';

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
 * Server action to load app configuration
 */
export async function getConfig(): Promise<{
  success: boolean;
  config?: AppConfig;
  error?: string;
}> {
  try {
    await ensureStorageStructure();
    const configPath = getConfigPath();

    if (!existsSync(configPath)) {
      const defaultConfig = createDefaultConfig();
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      return { success: true, config: defaultConfig };
    }

    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data) as AppConfig;
    return { success: true, config };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load config',
    };
  }
}

/**
 * Server action to update app configuration
 */
export async function updateConfig(updates: Partial<AppConfig>): Promise<{
  success: boolean;
  config?: AppConfig;
  error?: string;
}> {
  try {
    await ensureStorageStructure();
    const configPath = getConfigPath();

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

    return { success: true, config: updatedConfig };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update config',
    };
  }
}
