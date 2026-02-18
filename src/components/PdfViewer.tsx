'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { updateLastAccessed, loadMetadata, updateMetadata } from '../services/metadata';

// Configure PDF.js worker using CDN to avoid Next.js bundling issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  pdfData: Uint8Array;
  documentId: string;
}

export default function PdfViewer({ pdfData, documentId }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sideBySide, setSideBySide] = useState<boolean>(true);
  const [pageOffset, setPageOffset] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollCooldown = useRef(false);

  // Track lastAccessed when document opens and load view settings
  useEffect(() => {
    updateLastAccessed(documentId).catch((error) => {
      console.error('Failed to update lastAccessed:', error);
    });

    // Load view settings from metadata
    loadMetadata(documentId).then((result) => {
      if (result.success && result.metadata) {
        setSideBySide(result.metadata.sideBySide);
        setPageOffset(result.metadata.pageOffset);
      }
    });
  }, [documentId]);

  // Save view settings to metadata when they change
  useEffect(() => {
    const saveViewSettings = async () => {
      try {
        await updateMetadata(documentId, {
          sideBySide,
          pageOffset,
        });
      } catch (error) {
        console.error('Failed to save view settings:', error);
      }
    };

    saveViewSettings();
  }, [sideBySide, pageOffset, documentId]);

  // Reset state when document changes
  useEffect(() => {
    setPageNumber(1);
    setLoadError(null);
  }, [documentId]);

  // Measure container size for fitting pages to screen
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // How many pages to step by
  // With offset on page 1, step by 1 to get to page 2 (start of pairs)
  const pageStep = (() => {
    if (!sideBySide || numPages <= 1) return 1;
    if (pageOffset && pageNumber === 1) return 1; // step from 1 to 2
    return 2;
  })();

  const goNextPage = useCallback(() => {
    setPageNumber((prev) => {
      const next = prev + pageStep;
      return next <= numPages ? next : prev;
    });
  }, [numPages, pageStep]);

  const goPrevPage = useCallback(() => {
    setPageNumber((prev) => {
      if (!sideBySide || numPages <= 1) {
        return Math.max(1, prev - 1);
      }
      // With offset: from page 2, go back to page 1 (single)
      if (pageOffset && prev === 2) return 1;
      const next = prev - 2;
      return next >= 1 ? next : 1;
    });
  }, [sideBySide, numPages, pageOffset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle arrow keys if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goPrevPage();
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goNextPage();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNextPage, goPrevPage]);

  // Scroll wheel changes pages (with cooldown to prevent rapid firing)
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (scrollCooldown.current) return;

      // Require a meaningful scroll delta to trigger
      if (Math.abs(event.deltaY) < 10) return;

      scrollCooldown.current = true;
      if (event.deltaY > 0) {
        goNextPage();
      } else {
        goPrevPage();
      }

      // Cooldown prevents rapid page flipping from trackpad momentum
      setTimeout(() => {
        scrollCooldown.current = false;
      }, 250);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [goNextPage, goPrevPage]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setLoadError(error.message || 'Unknown error loading PDF');
  }, []);

  // Stable file data reference
  const [fileData, setFileData] = useState<{ data: Uint8Array } | null>(null);
  useEffect(() => {
    if (pdfData && pdfData.length > 0) {
      const copy = new Uint8Array(pdfData);
      setFileData({ data: copy });
    } else {
      setFileData(null);
    }
  }, [pdfData]);

  // Calculate page height to fit the screen
  // Leave a small margin so the page doesn't touch edges
  const pageHeight = containerSize.height > 0 ? containerSize.height - 16 : undefined;

  // In side-by-side mode, show current page and next page
  // With offset, the first view shows only page 1, then pairs are 2-3, 4-5, etc.
  const showSecondPage = sideBySide && numPages > 1 && pageNumber + 1 <= numPages;

  // Determine if current position is a "single page" spot due to offset
  // Offset means page 1 is shown alone, then pairs start from page 2
  const isSingleDueToOffset = sideBySide && pageOffset && pageNumber === 1 && numPages > 1;

  // Page indicator text
  const pageIndicator = (() => {
    if (numPages <= 1) return '';
    if (isSingleDueToOffset) {
      return `1 / ${numPages}`;
    }
    if (showSecondPage && !isSingleDueToOffset) {
      return `${pageNumber}-${pageNumber + 1} / ${numPages}`;
    }
    return `${pageNumber} / ${numPages}`;
  })();

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-neutral-900 overflow-hidden select-none"
    >
      {loadError ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-red-400">Failed to load PDF</div>
          <div className="text-xs text-neutral-500 max-w-md text-center">
            {loadError}
          </div>
        </div>
      ) : fileData ? (
        <Document
          file={fileData}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div />}
        >
          <div className="flex items-center justify-center h-full gap-1">
            <Page
              pageNumber={pageNumber}
              height={pageHeight}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading=""
            />
            {showSecondPage && !isSingleDueToOffset && (
              <Page
                pageNumber={pageNumber + 1}
                height={pageHeight}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading=""
              />
            )}
          </div>
        </Document>
      ) : (
        <div />
      )}

      {/* Page indicator */}
      {numPages > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          {pageIndicator}
        </div>
      )}

      {/* Side-by-side toggle */}
      {numPages > 1 && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2">
          {sideBySide && (
            <button
              onClick={() => {
                setPageOffset((prev) => !prev);
                setPageNumber(1);
              }}
              className={`bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full transition ${
                pageOffset ? 'ring-1 ring-white/40' : ''
              }`}
              title={pageOffset ? 'Offset: on (1, 2-3, 4-5)' : 'Offset: off (1-2, 3-4)'}
            >
              {pageOffset ? '+1' : '+0'}
            </button>
          )}
          <button
            onClick={() => setSideBySide((prev) => !prev)}
            className="bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full transition"
            title={sideBySide ? 'Switch to single page' : 'Switch to side by side'}
          >
            {sideBySide ? '⬜⬜ 2' : '⬜ 1'}
          </button>
        </div>
      )}
    </div>
  );
}
