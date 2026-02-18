import { useState, useRef } from 'react';
import { uploadDocument } from '@/actions/documents';

interface DocumentUploadProps {
  onUploadComplete?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

export default function DocumentUpload({
  onUploadComplete,
  onUploadError,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      const result = await uploadDocument(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload document');
      }

      setIsUploading(false);
      onUploadComplete?.(result.documentId!);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload document';
      onUploadError?.(errorMessage);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#2f2f2f] text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        title="Upload PDF"
      >
        {isUploading ? (
          <>
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
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Upload</span>
          </>
        )}
      </button>
    </>
  );
}
