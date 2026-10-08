import React from 'react';
import type { InvoiceItem } from '../../types';

interface TaxSummaryCardProps {
  items: InvoiceItem[];
}

/**
 * Compact financial tax breakdown and grand total summary component.
 */
export const TaxSummaryCard: React.FC<TaxSummaryCardProps> = ({ items }) => {
  const sumTaxable = items.reduce((acc, it) => acc + (Number(it.taxable_value) || 0), 0);
  const sumCgst = items.reduce((acc, it) => acc + (Number(it.cgst_amount) || 0), 0);
  const sumSgst = items.reduce((acc, it) => acc + (Number(it.sgst_amount) || 0), 0);
  const sumIgst = items.reduce((acc, it) => acc + (Number(it.igst_amount) || 0), 0);
  const sumGrandTotal = items.reduce((acc, it) => acc + (Number(it.total_amount) || 0), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {/* Taxable Amount */}
        <div className="pt-2 sm:pt-0 sm:pr-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Taxable Amount
          </p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">
            ₹{sumTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* CGST */}
        <div className="pt-2 sm:pt-0 sm:px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            CGST (Central)
          </p>
          <p className="text-lg font-bold font-mono text-slate-800 mt-1">
            ₹{sumCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* SGST */}
        <div className="pt-2 sm:pt-0 sm:px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            SGST (State)
          </p>
          <p className="text-lg font-bold font-mono text-slate-800 mt-1">
            ₹{sumSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* IGST */}
        <div className="pt-2 sm:pt-0 sm:px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            IGST (Integrated)
          </p>
          <p className="text-lg font-bold font-mono text-slate-800 mt-1">
            ₹{sumIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Grand Total */}
        <div className="pt-2 sm:pt-0 sm:pl-4 col-span-2 sm:col-span-1 bg-slate-50/80 -my-2 -mr-2 p-3 rounded-md border border-slate-200">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Grand Total
          </p>
          <p className="text-xl font-extrabold font-mono text-slate-900 mt-1">
            ₹{sumGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};
