import React from 'react';
import type { Invoice } from '../../types';
import { ArrowRight, CheckCircle2, Clock, XCircle, FileSpreadsheet } from 'lucide-react';

interface InvoiceStatusSummaryWidgetProps {
  invoices: Invoice[];
  onNavigateToInvoices: () => void;
}

/**
 * Processing status summary widget displaying audit status breakdown and tax totals.
 */
export const InvoiceStatusSummaryWidget: React.FC<InvoiceStatusSummaryWidgetProps> = ({
  invoices,
  onNavigateToInvoices,
}) => {
  const total = invoices.length || 1;
  const approved = invoices.filter((i) => i.status === 'APPROVED').length;
  const pending = invoices.filter((i) => i.status === 'PENDING_APPROVAL').length;
  const rejected = invoices.filter((i) => i.status === 'REJECTED').length;

  const totalTax = invoices.reduce(
    (acc, inv) =>
      acc +
      (Number(inv.total_cgst) || 0) +
      (Number(inv.total_sgst) || 0) +
      (Number(inv.total_igst) || 0),
    0
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">Processing Breakdown</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {invoices.length} Invoices
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Status Breakdown items */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-slate-800">Approved</span>
            </div>
            <div className="font-mono font-semibold text-slate-900">
              {approved}{' '}
              <span className="text-[11px] font-normal text-slate-500">
                ({Math.round((approved / total) * 100)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-slate-800">Pending Review</span>
            </div>
            <div className="font-mono font-semibold text-slate-900">
              {pending}{' '}
              <span className="text-[11px] font-normal text-slate-500">
                ({Math.round((pending / total) * 100)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs p-2.5 rounded-md bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span className="font-medium text-slate-800">Rejected</span>
            </div>
            <div className="font-mono font-semibold text-slate-900">
              {rejected}{' '}
              <span className="text-[11px] font-normal text-slate-500">
                ({Math.round((rejected / total) * 100)}%)
              </span>
            </div>
          </div>

          {/* Statutory Tax Extracted Total */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Tax Reconciled</span>
            <span className="font-mono font-bold text-slate-900">
              ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-right">
        <button
          type="button"
          onClick={onNavigateToInvoices}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <span>View All Invoices</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
