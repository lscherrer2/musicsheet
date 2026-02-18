import { useState, useEffect } from 'react';
import type { DocumentIndexEntry } from '../types/document';
import DocumentUpload from './DocumentUpload';
import { getThumbnailUrl } from '../services/thumbnail';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentIndexEntry[];
  selectedDocumentId: string | null;
  onDocumentClick: (documentId: string) => void;
  onDocumentDelete: (documentId: string) => void;
  onEditMetadata: (documentId: string) => void;
  onUploadComplete?: (documentId: string) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  documents,
  selectedDocumentId,
  onDocumentClick,
  onDocumentDelete,
  onEditMetadata,
  onUploadComplete,
}: SidebarProps) {
  const [mouseX, setMouseX] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<string, boolean>>({});

  // Track mouse position for auto-hide
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-hide when mouse leaves sidebar area
  useEffect(() => {
    if (isOpen && mouseX > 380) {
      onClose();
      setConfirmDeleteId(null);
    }
  }, [isOpen, mouseX, onClose]);

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDocumentDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-96 bg-[#171717] shadow-2xl z-40 transform transition-transform ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0 duration-300' : '-translate-x-full duration-150'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#424242] flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-gray-100">
              MusicSheet
            </h2>
            <div className="flex items-center gap-2">
              <DocumentUpload
                onUploadComplete={(documentId) => {
                  onUploadComplete?.(documentId);
                  onDocumentClick(documentId);
                }}
                onUploadError={(error) => {
                  console.error('Upload failed:', error);
                  alert(`Upload failed: ${error}`);
                }}
              />
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#2f2f2f] rounded-lg transition"
              >
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto py-2">
          {documents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500 text-sm">
              No documents yet. Upload your first sheet music!
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {documents.map((doc) => {
                const isSelected = doc.id === selectedDocumentId;
                const isConfirmingDelete = confirmDeleteId === doc.id;
                const thumbUrl = getThumbnailUrl(doc.id);
                const hasThumbError = thumbnailErrors[doc.id];

                return (
                  <div
                    key={doc.id}
                    className={`group relative rounded-lg transition ${
                      isSelected
                        ? 'bg-[#2f2f2f]'
                        : 'hover:bg-[#2f2f2f]/50'
                    }`}
                  >
                    {/* Document row */}
                    <button
                      onClick={() => {
                        onDocumentClick(doc.id);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2.5 pr-20 flex items-center gap-3"
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-10 h-14 rounded overflow-hidden bg-[#2f2f2f]">
                        {!hasThumbError ? (
                          <img
                            src={thumbUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() =>
                              setThumbnailErrors((prev) => ({ ...prev, [doc.id]: true }))
                            }
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-gray-600"
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

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium text-sm line-clamp-1 ${
                            isSelected
                              ? 'text-gray-100'
                              : 'text-gray-200'
                          }`}
                        >
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {doc.composer || 'Unknown Composer'}
                        </div>
                      </div>
                    </button>

                    {/* Action buttons (visible on hover) */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditMetadata(doc.id);
                          onClose();
                        }}
                        className="p-1.5 hover:bg-[#424242] rounded transition"
                        title="Edit metadata"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className={`p-1.5 rounded transition ${
                          isConfirmingDelete
                            ? 'bg-red-900/50 hover:bg-red-900/70'
                            : 'hover:bg-[#424242]'
                        }`}
                        title={isConfirmingDelete ? 'Click again to confirm' : 'Delete'}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            isConfirmingDelete
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard shortcut hints */}
        <div className="flex-shrink-0 p-4 border-t border-[#424242] bg-[#171717]">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Search</span>
              <kbd className="px-2 py-1 bg-[#2f2f2f] border border-[#424242] rounded text-xs">
                Cmd+K
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
