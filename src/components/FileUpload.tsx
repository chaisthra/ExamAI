'use client';
import { useState, useRef } from 'react';

interface UploadedFile {
  name: string;
  text: string;
  fileType: string;
  wordCount: number;
}

interface FileUploadProps {
  onFileParsed: (file: UploadedFile) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
}

export default function FileUpload({ onFileParsed, uploadedFiles, onRemoveFile }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        setError(`${file.name} is too large (max 20MB)`);
        continue;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/parse-file', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to parse file');
        } else {
          onFileParsed(data);
        }
      } catch {
        setError(`Failed to upload ${file.name}`);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const fileTypeIcon = (type: string) => {
    const icons: Record<string, string> = { pdf: '📄', docx: '📝', pptx: '📊', text: '📃' };
    return icons[type] || '📁';
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          uploading
            ? 'border-blue-400 bg-blue-50 cursor-wait'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Parsing file...</span>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2">📂</div>
            <p className="text-sm font-medium text-gray-700">Drop files here or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOCX, PPTX, TXT — up to 20MB each</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-900">×</button>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="text-lg">{fileTypeIcon(file.fileType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{file.wordCount.toLocaleString()} words extracted</p>
              </div>
              <button
                onClick={() => onRemoveFile(i)}
                className="text-gray-400 hover:text-red-500 text-lg leading-none transition-colors"
                title="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
