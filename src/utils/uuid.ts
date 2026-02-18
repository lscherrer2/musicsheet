import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4 for new documents
 */
export function generateId(): string {
  return uuidv4();
}
