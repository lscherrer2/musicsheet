import type { AppConfig } from '../types/document';
import { getConfig, updateConfig } from '@/actions/config';

/**
 * Load the app configuration
 */
export async function loadConfig(): Promise<{
  success: boolean;
  config?: AppConfig;
  error?: string;
}> {
  return await getConfig();
}

/**
 * Save the app configuration
 */
export async function saveConfig(
  config: AppConfig
): Promise<{ success: boolean; error?: string }> {
  return await updateConfig(config);
}

/**
 * Update the last opened document
 */
export async function updateLastOpened(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loadResult = await loadConfig();
    if (!loadResult.success || !loadResult.config) {
      return { success: false, error: loadResult.error };
    }

    const config = loadResult.config;
    config.lastOpenedDocumentId = documentId;

    return await saveConfig(config);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update last opened',
    };
  }
}

/**
 * Add a document to the recent documents list
 * Maintains a maximum of 5 recent documents
 */
export async function addRecentDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const loadResult = await loadConfig();
    if (!loadResult.success || !loadResult.config) {
      return { success: false, error: loadResult.error };
    }

    const config = loadResult.config;

    // Remove if already in list
    config.recentDocuments = config.recentDocuments.filter(
      (id) => id !== documentId
    );

    // Add to front of list
    config.recentDocuments.unshift(documentId);

    // Keep only 5 most recent
    if (config.recentDocuments.length > 5) {
      config.recentDocuments = config.recentDocuments.slice(0, 5);
    }

    return await saveConfig(config);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add recent document',
    };
  }
}

/**
 * Update sort preferences
 */
export async function updateSortPreferences(
  sortBy: AppConfig['sortBy'],
  sortDirection: AppConfig['sortDirection']
): Promise<{ success: boolean; error?: string }> {
  try {
    const loadResult = await loadConfig();
    if (!loadResult.success || !loadResult.config) {
      return { success: false, error: loadResult.error };
    }

    const config = loadResult.config;
    config.sortBy = sortBy;
    config.sortDirection = sortDirection;

    return await saveConfig(config);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update sort preferences',
    };
  }
}
