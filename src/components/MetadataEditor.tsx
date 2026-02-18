import { useState, useEffect } from 'react';
import type { DocumentMetadata } from '../types/document';
import { loadMetadata, updateMetadata } from '../services/metadata';

interface MetadataEditorProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function MetadataEditor({
  documentId,
  isOpen,
  onClose,
  onSave,
}: MetadataEditorProps) {
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [instrument, setInstrument] = useState('');

  // Load metadata when modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      setIsLoading(true);
      setError(null);

      loadMetadata(documentId).then((result) => {
        if (result.success && result.metadata) {
          const meta = result.metadata;
          setMetadata(meta);
          setTitle(meta.title);
          setComposer(meta.composer);
          setInstrument(meta.instrument);
        } else {
          setError(result.error || 'Failed to load metadata');
        }
        setIsLoading(false);
      });
    }
  }, [isOpen, documentId]);

  const handleSave = async () => {
    if (!metadata) return;

    // Validate
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update metadata (also updates index on the server)
      const result = await updateMetadata(documentId, {
        title: title.trim(),
        composer: composer.trim(),
        instrument: instrument.trim(),
      });

      if (!result.success || !result.metadata) {
        throw new Error(result.error || 'Failed to update metadata');
      }

      setIsSaving(false);
      onSave?.();
      onClose();
    } catch (err) {
      setIsSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to save metadata');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#171717] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[#424242]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#424242]">
            <h2 className="text-xl font-medium text-gray-100">
              Edit Metadata
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#424242] rounded-lg transition"
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
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
              </div>
            ) : error && !metadata ? (
              <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300">
                {error}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-[#424242] rounded-lg bg-[#2f2f2f] text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none"
                    placeholder="e.g. Moonlight Sonata - 1st Movement"
                  />
                </div>

                {/* Composer */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Composer
                  </label>
                  <input
                    type="text"
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    className="w-full px-3 py-2 border border-[#424242] rounded-lg bg-[#2f2f2f] text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none"
                    placeholder="e.g. Ludwig van Beethoven"
                  />
                </div>

                {/* Instrument */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Instrument
                  </label>
                  <input
                    type="text"
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="w-full px-3 py-2 border border-[#424242] rounded-lg bg-[#2f2f2f] text-gray-100 placeholder-gray-500 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none"
                    placeholder="e.g. Piano"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[#424242]">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2 text-gray-300 hover:bg-[#424242] rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-5 py-2 bg-white hover:bg-gray-200 text-gray-900 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isSaving && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
