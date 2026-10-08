import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { InvoiceStatus } from '../../types';

interface ReviewHeaderBannerProps {
  invoiceNumber: string;
  status: InvoiceStatus;
  onBack: () => void;
}

/**
 * Visual header banner displaying invoice status and the 4-step workflow stepper.
 */
export const ReviewHeaderBanner: React.FC<ReviewHeaderBannerProps> = ({
  invoiceNumber,
  status,
  onBack,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
          title="Back to Invoices"
          aria-label="Back to Invoices"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900">
              Invoice {invoiceNumber}
            </h2>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {status === 'PENDING_APPROVAL' ? 'Pending Review' : status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify line items and statutory taxes before approval.
          </p>
        </div>
      </div>

      {/* Workflow Breadcrumb Stepper */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="text-slate-400">1. Upload</span>
        <span className="text-slate-300">→</span>
        <span className="text-slate-400">2. Extraction</span>
        <span className="text-slate-300">→</span>
        <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded">
          3. Review & Verify
        </span>
        <span className="text-slate-300">→</span>
        <span className="text-slate-400">4. Approve Invoice</span>
      </div>
    </div>
  );
};
