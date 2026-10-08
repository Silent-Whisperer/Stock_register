import React from 'react';
import { FileText, X, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface FilePreviewCardProps {
  file: File;
  previewUrl: string | null;
  onChangeFile: () => void;
  onRemoveFile: () => void;
  onProcess: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatFileType(file: File): string {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return 'PDF document';
  if (file.type.includes('png') || file.name.endsWith('.png')) return 'PNG image';
  if (file.type.includes('jpeg') || file.type.includes('jpg') || file.name.match(/\.jpe?g$/i)) return 'JPEG image';
  if (file.type.includes('webp') || file.name.endsWith('.webp')) return 'WEBP image';
  return file.type || 'Document';
}

/**
 * Clean file preview card displaying selected document metadata, preview thumbnail, and process actions.
 */
export const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
  file,
  previewUrl,
  onChangeFile,
  onRemoveFile,
  onProcess,
}) => {
  return (
    <div className="space-y-6">
      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {previewUrl ? (
            <div className="w-14 h-14 rounded border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded border border-slate-200 bg-white flex items-center justify-center shrink-0 text-slate-500">
              <FileText className="w-7 h-7" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatFileType(file)} · {formatFileSize(file.size)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onChangeFile}
          >
            Change file
          </Button>
          <button
            type="button"
            onClick={onRemoveFile}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded transition-colors"
            aria-label="Remove file"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {previewUrl && (
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/30 flex justify-center max-h-72 overflow-hidden">
          <img src={previewUrl} alt="Selected invoice preview" className="max-h-64 object-contain rounded" />
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onRemoveFile}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          Cancel
        </button>
        <Button
          variant="primary"
          size="md"
          onClick={onProcess}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          Process Invoice
        </Button>
      </div>
    </div>
  );
};
