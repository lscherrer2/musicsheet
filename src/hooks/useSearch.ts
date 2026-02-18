import { useState, useMemo, useCallback } from 'react';
import type { DocumentIndexEntry } from '../types/document';
import { searchDocuments, type SearchResult } from '../services/search';

interface UseSearchOptions {
  documents: DocumentIndexEntry[];
  maxResults?: number;
  onSelect?: (documentId: string) => void;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  openSelected: () => void;
  clearSearch: () => void;
  hasResults: boolean;
}

/**
 * Custom hook for managing search state and keyboard navigation
 * 
 * Features:
 * - Live/instant search (updates on every character)
 * - Keyboard navigation (Up/Down arrows)
 * - Enter to open selected document
 * - ESC to clear search
 */
export function useSearch({
  documents,
  maxResults = 10,
  onSelect,
}: UseSearchOptions): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Perform search whenever query or documents change (using useMemo)
  const results = useMemo(() => {
    if (query.trim().length >= 2) {
      return searchDocuments(query, documents, maxResults);
    }
    return [];
  }, [query, documents, maxResults]);

  // Reset selected index when results change
  const currentSelectedIndex = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.min(selectedIndex, results.length - 1);
  }, [results, selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;

        case 'Enter':
          e.preventDefault();
          if (results[currentSelectedIndex]) {
            const documentId = results[currentSelectedIndex].item.id;
            onSelect?.(documentId);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setQuery('');
          setSelectedIndex(0);
          break;
      }
    },
    [results, currentSelectedIndex, onSelect]
  );

  // Open the currently selected document
  const openSelected = useCallback(() => {
    if (results[currentSelectedIndex]) {
      const documentId = results[currentSelectedIndex].item.id;
      onSelect?.(documentId);
    }
  }, [results, currentSelectedIndex, onSelect]);

  // Clear search state
  const clearSearch = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
  }, []);

  return {
    query,
    setQuery,
    results,
    selectedIndex: currentSelectedIndex,
    setSelectedIndex,
    handleKeyDown,
    openSelected,
    clearSearch,
    hasResults: results.length > 0,
  };
}
