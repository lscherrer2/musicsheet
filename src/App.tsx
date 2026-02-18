'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SearchBar from './components/SearchBar';
import Sidebar from './components/Sidebar';
import MetadataEditor from './components/MetadataEditor';
import { ThemeProvider } from './contexts/ThemeContext';
import { getAllDocuments, removeFromIndex } from './services/indexService';
import { ensureStorageStructure, deleteDocument } from './services/storage';
import type { DocumentIndexEntry } from './types/document';

// Dynamically import PdfViewer with SSR disabled to avoid pdfjs-dist server-side issues
const PdfViewer = dynamic(() => import('./components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#212121]">
      <div className="text-gray-400">Loading PDF viewer...</div>
    </div>
  ),
});

function App() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Load documents and auto-select the most recent one
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await ensureStorageStructure();

      const result = await getAllDocuments();
      if (result.success && result.documents) {
        const sorted = [...result.documents].sort(
          (a, b) =>
            new Date(b.lastAccessed).getTime() -
            new Date(a.lastAccessed).getTime()
        );
        setDocuments(sorted);

        // Default to the most recently accessed document
        if (sorted.length > 0) {
          setSelectedDocumentId(sorted[0].id);
        }
      }
      setLoading(false);
    };

    init();
  }, []);

  const refreshDocuments = async () => {
    const result = await getAllDocuments();
    if (result.success && result.documents) {
      const sorted = [...result.documents].sort(
        (a, b) =>
          new Date(b.lastAccessed).getTime() -
          new Date(a.lastAccessed).getTime()
      );
      setDocuments(sorted);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      if (event.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Mouse gesture for sidebar (0-20px from left edge)
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientX <= 20 && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isSidebarOpen]);

  // Handlers
  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsSearchOpen(false);
    setIsSidebarOpen(false);
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      await removeFromIndex(documentId);
      await refreshDocuments();

      // If we deleted the currently viewed doc, switch to the next one
      if (selectedDocumentId === documentId) {
        const result = await getAllDocuments();
        if (result.success && result.documents && result.documents.length > 0) {
          const sorted = [...result.documents].sort(
            (a, b) =>
              new Date(b.lastAccessed).getTime() -
              new Date(a.lastAccessed).getTime()
          );
          setSelectedDocumentId(sorted[0].id);
        } else {
          setSelectedDocumentId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleUploadComplete = async (documentId: string) => {
    const result = await getAllDocuments();
    if (result.success && result.documents) {
      const sorted = [...result.documents].sort(
        (a, b) =>
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      );
      setDocuments(sorted);
      // Open the newly uploaded document (most recently added)
      if (sorted.length > 0) {
        setSelectedDocumentId(documentId);
        setIsEditingMetadata(true); // Open metadata editor immediately
      }
    }
  };

  // Load PDF data for viewer
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!selectedDocumentId) {
      setPdfData(null);
      return;
    }

    let cancelled = false;
    setPdfLoading(true);
    setPdfData(null);

    fetch(`/api/documents/${selectedDocumentId}/pdf`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          console.error('Failed to load PDF:', res.statusText);
          setPdfLoading(false);
          return;
        }
        const arrayBuffer = await res.arrayBuffer();
        if (cancelled) return;
        setPdfData(new Uint8Array(arrayBuffer));
        setPdfLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load PDF:', error);
        setPdfLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDocumentId]);

  if (loading) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center h-screen bg-[#212121]">
          <div className="text-gray-400">Loading...</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="relative h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          documents={documents}
          selectedDocumentId={selectedDocumentId}
          onDocumentClick={handleDocumentSelect}
          onDocumentDelete={handleDocumentDelete}
          onEditMetadata={(id: string) => {
            setSelectedDocumentId(id);
            setIsEditingMetadata(true);
          }}
          onUploadComplete={handleUploadComplete}
        />

        {/* Main content */}
        <div className="h-full">
          {selectedDocumentId && pdfData ? (
            <PdfViewer pdfData={pdfData} documentId={selectedDocumentId} />
          ) : selectedDocumentId && pdfLoading ? (
            <div className="flex items-center justify-center h-screen bg-[#212121]">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-screen bg-[#212121]">
              <div className="text-center text-gray-500">
                <p className="text-lg">No document open</p>
                <p className="text-sm mt-2">
                  Move your mouse to the left edge to open the sidebar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search overlay */}
        <SearchBar
          documents={documents}
          onDocumentSelect={handleDocumentSelect}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        {/* Metadata editor modal */}
        {isEditingMetadata && selectedDocumentId && (
          <MetadataEditor
            documentId={selectedDocumentId}
            isOpen={isEditingMetadata}
            onClose={() => setIsEditingMetadata(false)}
            onSave={() => {
              setIsEditingMetadata(false);
              refreshDocuments();
            }}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
