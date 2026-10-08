import React from 'react';
import type { Supplier } from '../../types';
import { Mail, MapPin, Trash2 } from 'lucide-react';

interface SupplierTableProps {
  suppliers: Supplier[];
  loading: boolean;
  onDeleteSupplier?: (id: string) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({ suppliers, loading, onDeleteSupplier }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Supplier Name</th>
              <th className="px-4 py-3">GSTIN</th>
              <th className="px-4 py-3">State Code</th>
              <th className="px-4 py-3">Address & Contact</th>
              <th className="px-4 py-3 text-center">Invoices</th>
              <th className="px-4 py-3 text-right">Total Billed Volume (₹)</th>
              {onDeleteSupplier && <th className="px-4 py-3 text-center w-16">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Loading supplier directory...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No suppliers registered yet.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-700">
                    {s.gstin || 'Not registered'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {s.state_code || (s.gstin ? s.gstin.slice(0, 2) : '—')}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    {s.address && (
                      <div className="flex items-center gap-1 truncate text-slate-700">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{s.address}</span>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">
                    {s.invoices_count ?? 1}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    ₹{(s.total_spend ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  {onDeleteSupplier && (
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete supplier "${s.name}"?`)) {
                            onDeleteSupplier(s.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Supplier"
                        aria-label={`Delete ${s.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
