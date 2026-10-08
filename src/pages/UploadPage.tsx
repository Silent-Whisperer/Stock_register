import React, { useState, useRef, useEffect } from 'react';
import { uploadAndExtractInvoice } from '../services/api';
import { createInvoiceFromExtraction } from '../services/invoiceService';
import { useNotification } from '../context/NotificationContext';
import { Upload } from 'lucide-react';
import { Button } from '../components/common/Button';
import { ProcessingStatus, type ProcessingStep } from '../components/upload/ProcessingStatus';
import { FilePreviewCard } from '../components/upload/FilePreviewCard';

interface UploadPageProps {
  onExtractionSuccess: (invoiceId: string) => void;
}

/**
 * Focused, professional Invoice Intake workspace.
 * Clean, single-purpose interface for uploading and processing supplier invoices.
 */
export const UploadPage: React.FC<UploadPageProps> = ({ onExtractionSuccess }) => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          handleFileSelect(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isProcessing]);

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const isAllowedExt = Boolean(file.name.match(/\.(pdf|png|jpe?g|webp)$/i));

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      notifyError('Invalid File Format', 'Only PDF, PNG, JPG, JPEG, and WEBP files are supported.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      notifyError('File Too Large', 'Invoice file size must be less than 15MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcessInvoice = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingStep('uploading');

    try {
      setProcessingStep('extracting');
      const extraction = await uploadAndExtractInvoice(selectedFile);

      setProcessingStep('preparing');

      let filePreviewUrl: string | null = null;
      try {
        filePreviewUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file preview'));
          reader.readAsDataURL(selectedFile);
        });
      } catch {
        // Fallback gracefully
      }

      const savedInvoice = await createInvoiceFromExtraction(extraction, filePreviewUrl);
      notifySuccess('Invoice Ready', `Invoice #${savedInvoice.invoice_number} loaded for review.`);
      onExtractionSuccess(savedInvoice.id);
    } catch (err: any) {
      notifyError('Processing Failed', err.message || 'Unable to process this invoice.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('idle');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Invoice Upload</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload a supplier invoice to extract and review its details.
        </p>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-xs">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          disabled={isProcessing}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {/* State 1: Processing */}
        {isProcessing ? (
          <ProcessingStatus fileName={selectedFile?.name} step={processingStep} />
        ) : selectedFile ? (
          /* State 2: File Selected (Preview & Action) */
          <FilePreviewCard
            file={selectedFile}
            previewUrl={previewUrl}
            onChangeFile={() => fileInputRef.current?.click()}
            onRemoveFile={() => setSelectedFile(null)}
            onProcess={handleProcessInvoice}
          />
        ) : (
          /* State 3: Empty Dropzone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-slate-900 bg-slate-100/70'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
              <div className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                <Upload className="w-5 h-5 text-slate-700" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  Upload a supplier invoice
                </p>
                <p className="text-xs text-slate-500">
                  PDF, JPG, PNG or WEBP · Maximum 15 MB
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose file
                </Button>
              </div>

              <p className="text-[11px] text-slate-400 pt-2">
                Drag and drop your file here, or paste from clipboard (Ctrl+V)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
