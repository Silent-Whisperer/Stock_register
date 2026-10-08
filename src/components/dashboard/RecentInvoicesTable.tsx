import React from 'react';
import type { Invoice } from '../../types';
import { Badge } from '../common/Badge';
import { Edit3 } from 'lucide-react';

interface RecentInvoicesTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoiceId: string) => void;
}

export const RecentInvoicesTable: React.FC<RecentInvoicesTableProps> = ({
  invoices,
  onSelectInvoice,
}) => {
  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="default">Draft</Badge>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Extracted Invoices & Items</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click any invoice to edit header details, line item rates, and quantities</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="px-4 py-2.5">Invoice #</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Supplier</th>
              <th className="px-4 py-2.5 text-right">Grand Total (₹)</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-right">Edit Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No invoices found. Go to Invoice Upload to extract your first invoice.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.invoice_date}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-medium">{inv.supplier_name}</div>
                    {inv.supplier_gstin && (
                      <div className="text-[10px] text-slate-400 font-mono">{inv.supplier_gstin}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    ₹{Number(inv.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(inv.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectInvoice(inv.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-white bg-slate-100 hover:bg-slate-900 px-3 py-1.5 rounded transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{inv.status === 'PENDING_APPROVAL' ? 'Edit & Review Items' : 'View & Edit Details'}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
