import type { DocumentIndexEntry } from '../types/document';

/**
 * Search result with relevance score
 */
export interface SearchResult {
  item: DocumentIndexEntry;
  score?: number;
}

/**
 * Multi-term search: each word in the query must match somewhere in the document
 * @param query - Search query string
 * @param documents - Array of documents to search
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of search results sorted by relevance
 */
export function searchDocuments(
  query: string,
  documents: DocumentIndexEntry[],
  limit: number = 10
): SearchResult[] {
  // Empty query returns no results
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Split query into terms, remove empty strings
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  if (terms.length === 0) {
    return [];
  }

  // Score each document
  const scoredResults: SearchResult[] = [];

  for (const doc of documents) {
    // Combine all searchable fields into one string
    const searchText = [
      doc.title,
      doc.composer,
      doc.instrument,
    ]
      .join(' ')
      .toLowerCase();

    // Check if ALL terms match somewhere in the combined text
    const allTermsMatch = terms.every((term) => searchText.includes(term));

    if (!allTermsMatch) {
      continue;
    }

    // Calculate score based on how many fields match and position
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const composerLower = doc.composer.toLowerCase();
    const instrumentLower = doc.instrument.toLowerCase();

    for (const term of terms) {
      // Title matches are weighted highest
      if (titleLower.includes(term)) {
        score += 10;
        // Bonus for exact word match (not just substring)
        if (titleLower.split(/\s+/).includes(term)) {
          score += 5;
        }
        // Bonus if it's at the start
        if (titleLower.startsWith(term)) {
          score += 3;
        }
      }

      // Composer matches
      if (composerLower.includes(term)) {
        score += 7;
        if (composerLower.split(/\s+/).includes(term)) {
          score += 3;
        }
        if (composerLower.startsWith(term)) {
          score += 2;
        }
      }

      // Instrument matches
      if (instrumentLower.includes(term)) {
        score += 3;
        if (instrumentLower.split(/\s+/).includes(term)) {
          score += 2;
        }
      }
    }

    scoredResults.push({
      item: doc,
      score,
    });
  }

  // Sort by score (higher is better) and return top results
  scoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));

  return scoredResults.slice(0, limit);
}

/**
 * Filter documents by specific metadata fields
 */
export function filterDocuments(
  documents: DocumentIndexEntry[],
  filters: {
    instrument?: string;
    composer?: string;
  }
): DocumentIndexEntry[] {
  return documents.filter((doc) => {
    // Filter by instrument (case-insensitive)
    if (filters.instrument) {
      if (doc.instrument.toLowerCase() !== filters.instrument.toLowerCase()) {
        return false;
      }
    }

    // Filter by composer (case-insensitive partial match)
    if (filters.composer) {
      if (!doc.composer.toLowerCase().includes(filters.composer.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get unique values for a field across all documents
 * Useful for populating filter dropdowns
 */
export function getUniqueValues(
  documents: DocumentIndexEntry[],
  field: 'instrument' | 'composer'
): string[] {
  const values = new Set<string>();

  documents.forEach((doc) => {
    const value = doc[field];
    if (value) {
      values.add(value);
    }
  });

  return Array.from(values).sort();
}
