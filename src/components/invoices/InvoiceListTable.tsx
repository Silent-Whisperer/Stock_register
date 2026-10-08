import React from 'react';
import type { Invoice } from '../../types';
import { Badge } from '../common/Badge';
import { Eye, CheckCircle2 } from 'lucide-react';

interface InvoiceListTableProps {
  invoices: Invoice[];
  onSelectInvoice: (id: string) => void;
}

export const InvoiceListTable: React.FC<InvoiceListTableProps> = ({
  invoices,
  onSelectInvoice,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Invoice Details</th>
              <th className="px-4 py-3">Supplier & GSTIN</th>
              <th className="px-4 py-3 text-right">Taxable (₹)</th>
              <th className="px-4 py-3 text-right">Tax (CGST+SGST+IGST)</th>
              <th className="px-4 py-3 text-right">Grand Total (₹)</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No invoices matching the current filter.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const totalTax = (Number(inv.total_cgst) || 0) + (Number(inv.total_sgst) || 0) + (Number(inv.total_igst) || 0);

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{inv.invoice_number}</div>
                      <div className="text-[11px] text-slate-500">Date: {inv.invoice_date}</div>
                      {inv.items && inv.items.length > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{inv.items.length} Line items</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{inv.supplier_name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{inv.supplier_gstin || 'GSTIN Not Specified'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      ₹{Number(inv.total_taxable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{Number(inv.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {inv.status === 'APPROVED' && <Badge variant="success">Approved</Badge>}
                      {inv.status === 'PENDING_APPROVAL' && <Badge variant="warning">Pending Review</Badge>}
                      {inv.status === 'REJECTED' && <Badge variant="danger">Rejected</Badge>}
                      {inv.status === 'DRAFT' && <Badge variant="default">Draft</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectInvoice(inv.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                          inv.status === 'PENDING_APPROVAL'
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        {inv.status === 'PENDING_APPROVAL' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify & Approve</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
