import React from 'react';
import type { Invoice } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface InvoiceHeaderFormProps {
  invoice: Partial<Invoice>;
  isReadOnly: boolean;
  onChange: (field: keyof Invoice, value: any) => void;
}

/**
 * Normalizes any date string (DD-MM-YYYY, DD/MM/YYYY, DD-MMM-YYYY) into HTML date input format (YYYY-MM-DD).
 */
function toIsoDate(raw?: string | null): string {
  if (!raw) return '';
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // DD-MMM-YYYY (e.g. 23-Sep-2026 or 22-Sep-2026)
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dMmmY = s.match(/^(\d{1,2})[-\s/]([A-Za-z]{3})[-\s/](\d{2,4})$/);
  if (dMmmY) {
    const day = dMmmY[1].padStart(2, '0');
    const mon = monthMap[dMmmY[2].toLowerCase()] || '01';
    let year = dMmmY[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${mon}-${day}`;
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return '';
}

/**
 * Validates whether a string matches Indian GSTIN syntax (15 alphanumeric characters).
 */
function isValidGstinFormat(gstin?: string | null): boolean {
  if (!gstin) return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin.trim());
}

/**
 * Extracted invoice header details editor with GSTIN format validation.
 */
export const InvoiceHeaderForm: React.FC<InvoiceHeaderFormProps> = ({
  invoice,
  isReadOnly,
  onChange,
}) => {
  const isSupplierGstinValid = isValidGstinFormat(invoice.supplier_gstin);
  const isBuyerGstinValid = isValidGstinFormat(invoice.buyer_gstin);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-5 space-y-4 h-[520px] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Extracted Invoice Details</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify and correct extracted parties, identifiers, and billing dates.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
          {isReadOnly ? 'Read Only' : 'Editable'}
        </span>
      </div>

      {/* Invoice Identifiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Invoice Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            disabled={isReadOnly}
            value={invoice.invoice_number || ''}
            onChange={(e) => onChange('invoice_number', e.target.value)}
            className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Invoice Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            disabled={isReadOnly}
            value={toIsoDate(invoice.invoice_date)}
            onChange={(e) => onChange('invoice_date', e.target.value)}
            className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
          <input
            type="date"
            disabled={isReadOnly}
            value={toIsoDate(invoice.due_date)}
            onChange={(e) => onChange('due_date', e.target.value)}
            className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
          />
        </div>
      </div>

      {/* Supplier Section */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Supplier (Billed From)
          </span>
          {invoice.supplier_gstin && isSupplierGstinValid && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Valid GSTIN Format</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Supplier Business Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={invoice.supplier_name || ''}
              onChange={(e) => onChange('supplier_name', e.target.value)}
              className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Supplier GSTIN</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={invoice.supplier_gstin || ''}
              onChange={(e) => onChange('supplier_gstin', e.target.value.toUpperCase())}
              placeholder="e.g. 19AHHPD6722G1Z2"
              className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm font-mono text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Buyer Section */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Buyer (Billed To)
          </span>
          {invoice.buyer_gstin && isBuyerGstinValid && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Valid GSTIN Format</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Buyer Business Name
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={invoice.buyer_name || ''}
              onChange={(e) => onChange('buyer_name', e.target.value)}
              className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Buyer GSTIN</label>
            <input
              type="text"
              disabled={isReadOnly}
              value={invoice.buyer_gstin || ''}
              onChange={(e) => onChange('buyer_gstin', e.target.value.toUpperCase())}
              placeholder="e.g. 19AABCA1234F1Z8"
              className="w-full h-9 px-3 border border-slate-300 rounded-md text-sm font-mono text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
