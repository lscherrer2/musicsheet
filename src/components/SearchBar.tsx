import { useEffect, useRef, useState } from 'react';
import { useSearch } from '../hooks/useSearch';
import type { DocumentIndexEntry } from '../types/document';
import { getThumbnailUrl } from '../services/thumbnail';

interface SearchBarProps {
  documents: DocumentIndexEntry[];
  onDocumentSelect: (documentId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({
  documents,
  onDocumentSelect,
  isOpen,
  onClose,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});

  const { query, setQuery, results, selectedIndex, handleKeyDown, clearSearch } =
    useSearch({
      documents,
      maxResults: 10,
      onSelect: (documentId) => {
        onDocumentSelect(documentId);
        clearSearch();
        onClose();
      },
    });

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key to close
  const handleKeyDownWithClose = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch();
      onClose();
    } else {
      handleKeyDown(e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={() => {
          clearSearch();
          onClose();
        }}
      />

      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-[#2f2f2f] rounded-lg shadow-2xl border border-[#424242]">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-[#424242]">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownWithClose}
              placeholder="Search by title, composer, or instrument..."
              className="flex-1 outline-none bg-transparent text-gray-100 placeholder-gray-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-gray-500 hover:text-gray-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => {
                const thumbUrl = getThumbnailUrl(result.item.id);
                const hasThumbError = thumbnailErrors[result.item.id];

                return (
                  <button
                    key={result.item.id}
                    onClick={() => {
                      onDocumentSelect(result.item.id);
                      clearSearch();
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2 border-b border-[#424242] last:border-b-0 transition ${
                      index === selectedIndex
                        ? 'bg-[#424242]'
                        : 'hover:bg-[#424242]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-8 h-11 rounded overflow-hidden bg-[#171717]">
                        {!hasThumbError ? (
                          <img
                            src={thumbUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() =>
                              setThumbnailErrors((prev) => ({
                                ...prev,
                                [result.item.id]: true,
                              }))
                            }
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-gray-600"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-medium text-sm text-gray-100 line-clamp-1">
                            {result.item.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {result.item.composer}
                          </p>
                          {result.item.instrument && (
                            <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-[#424242] rounded flex-shrink-0">
                              {result.item.instrument}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Enter hint */}
                      {index === selectedIndex && (
                        <div className="flex-shrink-0 text-xs text-gray-500 font-medium">
                          ↵
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center text-gray-500">
              No documents match your search.
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Type at least 2 characters to search...
            </div>
          )}

          {/* Footer hint */}
          <div className="p-3 bg-[#171717] border-t border-[#424242] rounded-b-lg">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>ESC Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
